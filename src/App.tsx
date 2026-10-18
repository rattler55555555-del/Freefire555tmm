import React, { useState, useEffect } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { Routes, Route, useNavigate, useLocation, Navigate, useParams } from 'react-router-dom';
import { Page, User } from './types';
import Header from './components/Header';
import BottomNav from './components/BottomNav';
import { auth, db, handleFirestoreError, OperationType } from './lib/firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc, setDoc, serverTimestamp, collection, query, where, getDocs, writeBatch, onSnapshot, increment, updateDoc } from 'firebase/firestore';
import { GAMES } from './constants';

// Pages
import Auth from './pages/Auth';
import Home from './pages/Home';
import Tournaments from './pages/Tournaments';
import JoinMatch from './pages/JoinMatch';
import WalletPage from './pages/Wallet';
import AddMoney from './pages/AddMoney';
import Withdraw from './pages/Withdraw';
import ProfilePage from './pages/Profile';
import AdminPage from './pages/Admin';
import AdminUserDetail from './pages/AdminUserDetail';
import AdminEditMatch from './pages/AdminEditMatch';
import AdminCreateMatch from './pages/AdminCreateMatch';
import ReferralPage from './pages/Referral';
import ProfileDetails from './pages/ProfileDetails';
import GameStats from './pages/GameStats';
import GameModes from './pages/GameModes';
import AdminModes from './pages/AdminModes';
import Leaderboard from './pages/Leaderboard';
import MatchDetails from './pages/MatchDetails';
import GlobalNotificationListener from './components/GlobalNotificationListener';

const DEFAULT_USER_DATA = {
  wallet: {
    deposit: 500, // Increased default for easier testing
    winnings: 0,
    bonus: 200,
  },
  isKycVerified: false,
  isAdmin: false,
  stats: {
    matchesPlayed: 0,
    totalWins: 0,
    totalKills: 0,
    totalWinnings: 0,
  }
};

const pageToPath = {
  [Page.LOGIN]: '/login',
  [Page.SIGNUP]: '/signup',
  [Page.HOME]: '/home',
  [Page.TOURNAMENTS]: '/tournaments',
  [Page.JOIN_MATCH]: '/match',
  [Page.WALLET]: '/wallet',
  [Page.ADD_MONEY]: '/wallet/add',
  [Page.WITHDRAW]: '/wallet/withdraw',
  [Page.PROFILE]: '/profile',
  [Page.ADMIN]: '/admin',
  [Page.ADMIN_USER_PROFILE]: '/admin/user',
  [Page.ADMIN_EDIT_MATCH]: '/admin/match/edit',
  [Page.ADMIN_CREATE_MATCH]: '/admin/match/create',
  [Page.REFERRAL]: '/referral',
  [Page.PROFILE_DETAILS]: '/profile/details',
  [Page.GAME_STATS]: '/profile/stats',
  [Page.GAME_MODES]: '/game-modes',
  [Page.ADMIN_MODES]: '/admin/modes',
  [Page.LEADERBOARD]: '/leaderboard',
  [Page.MATCH_DETAILS]: '/match-details'
};

const pathToPage: Record<string, Page> = {
  '/login': Page.LOGIN,
  '/signup': Page.SIGNUP,
  '/home': Page.HOME,
  '/tournaments': Page.TOURNAMENTS,
  '/match': Page.JOIN_MATCH,
  '/match-details': Page.MATCH_DETAILS,
  '/wallet': Page.WALLET,
  '/wallet/add': Page.ADD_MONEY,
  '/wallet/withdraw': Page.WITHDRAW,
  '/profile': Page.PROFILE,
  '/admin': Page.ADMIN,
  '/admin/user': Page.ADMIN_USER_PROFILE,
  '/admin/match/edit': Page.ADMIN_EDIT_MATCH,
  '/admin/match/create': Page.ADMIN_CREATE_MATCH,
  '/referral': Page.REFERRAL,
  '/profile/details': Page.PROFILE_DETAILS,
  '/profile/stats': Page.GAME_STATS,
  '/game-modes': Page.GAME_MODES,
  '/admin/modes': Page.ADMIN_MODES,
  '/leaderboard': Page.LEADERBOARD
};

function ScrollToTop() {
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [pathname]);
  return null;
}

export default function App() {
  const navigate = useNavigate();
  const location = useLocation();
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [joinedMatchIds, setJoinedMatchIds] = useState<string[]>([]);

  useEffect(() => {
    let unsubscribeUser: (() => void) | null = null;
    let unsubscribeRegs: (() => void) | null = null;

    const seedDatabase = async (email: string, uid: string) => {
      const isAdmin = email?.toLowerCase().trim() === "battlegrid2.0@gmail.com";
      if (!isAdmin) return;
      if (sessionStorage.getItem('kg_db_seed_checked')) return;
      sessionStorage.setItem('kg_db_seed_checked', 'true');
      try {
        // Independence seeding for games
        const gamesSnap = await getDocs(collection(db, 'games'));
        if (gamesSnap.empty) {
          const batch = writeBatch(db);
          GAMES.forEach(game => {
            batch.set(doc(db, 'games', game.id), game);
          });
          await batch.commit();
          console.log('Games seeded');
        }

        // Seeding game rules
        const rulesSnap = await getDocs(collection(db, 'gameRules'));
        if (rulesSnap.empty) {
          const batch = writeBatch(db);
          const defaultRules = [
            {
              id: 'battle_royale',
              type: 'Battle Royale',
              rules: [
                'No hacking or cheating allowed.',
                'No emulator players allowed.',
                'Using banned apps will lead to ban.',
                'Screenshot of match is mandatory.',
                'Respect other players.',
                'Late entry is not allowed.',
                'Admin decision will be final.'
              ]
            },
            {
              id: 'clash_squad',
              type: 'Clash Squad',
              rules: [
                'No hacking or cheating allowed.',
                'No emulator players allowed.',
                'Teaming with enemies is banned.',
                'Screenshot of match is mandatory.',
                'Respect other players.',
                'Late entry is not allowed.',
                'Admin decision will be final.'
              ]
            },
            {
              id: 'lone_wolf',
              type: 'Lone Wolf',
              rules: [
                'No hacking or cheating allowed.',
                'No emulator players allowed.',
                'Rank pushing is not allowed.',
                'Screenshot of match is mandatory.',
                'Respect other players.',
                'Late entry is not allowed.',
                'Admin decision will be final.'
              ]
            }
          ];
          defaultRules.forEach(rule => {
            batch.set(doc(db, 'gameRules', rule.id), rule);
          });
          await batch.commit();
          console.log('Game rules seeded');
        }

        // Seeding app settings
        const settingsSnap = await getDoc(doc(db, 'appSettings', 'referral_support'));
        if (!settingsSnap.exists()) {
          await setDoc(doc(db, 'appSettings', 'referral_support'), {
            referral: {
              baseUrl: window.location.origin,
              perReferralReward: 50,
              rewardType: 'bonus',
              depositPercentage: 50,
              bonusPercentage: 50,
              newUserReward: 10
            },
            support: {
              whatsapp: 'https://whatsapp.com/channel/0029Vb8LgeD0QeasJdM18j38',
              telegram: 'https://whatsapp.com/channel/0029Vb8LgeD0QeasJdM18j38',
              email: 'battlegrid2.0@gmail.com'
            }
          });
          console.log('App settings seeded');
        }

        // Seeding initial Game Modes from constants
        const modesSnap = await getDocs(collection(db, 'gameModes'));
        if (modesSnap.empty) {
          const { GAME_MODES_DATA } = await import('./constants');
          const batch = writeBatch(db);
          Object.entries(GAME_MODES_DATA).forEach(([gameId, modes]) => {
            modes.forEach((mode, index) => {
              const modeId = `${gameId}_${mode.id}`;
              batch.set(doc(db, 'gameModes', modeId), {
                ...mode,
                gameId,
                order: index
              });
            });
          });
          await batch.commit();
          console.log('Game modes seeded from constants');
        }
      } catch (error) {
        console.error('Error seeding database:', error);
      }
    };

    const unsubscribeAuth = onAuthStateChanged(auth, async (firebaseUser) => {
      if (unsubscribeUser) {
        unsubscribeUser();
        unsubscribeUser = null;
      }
      if (unsubscribeRegs) {
        unsubscribeRegs();
        unsubscribeRegs = null;
      }

      if (firebaseUser) {
        // Seed if admin (cached check)
        seedDatabase(firebaseUser.email || '', firebaseUser.uid);

        const userDocRef = doc(db, 'users', firebaseUser.uid);
        
        // Listen for user changes (balance, etc.) with non-blocking instant UI resolution
        unsubscribeUser = onSnapshot(userDocRef, async (userDoc) => {
          let userData: any;
          if (userDoc.exists()) {
            userData = userDoc.data();
          } else {
            const isAdmin = firebaseUser.email?.toLowerCase().trim() === 'battlegrid2.0@gmail.com';
            userData = {
              username: firebaseUser.displayName || (isAdmin ? 'Admin' : `Gamer_${firebaseUser.uid.slice(0, 5)}`),
              email: firebaseUser.email || '',
              phone: firebaseUser.phoneNumber || '9999999999',
              ...DEFAULT_USER_DATA,
              isAdmin: isAdmin
            };
            setDoc(userDocRef, {
              ...userData,
              createdAt: serverTimestamp()
            }, { merge: true }).catch(() => {});
          }

          // Ensure valid wallet structure exists
          if (!userData.wallet) {
            userData.wallet = {
              deposit: userData.walletBalance || 100,
              winnings: userData.winnings || 0,
              bonus: userData.bonus || 100
            };
            updateDoc(userDocRef, { wallet: userData.wallet }).catch(() => {});
          }

          const completeUser = { id: firebaseUser.uid, ...userData } as User;
          setUser(completeUser);
          setIsLoggedIn(true);
          setLoading(false);

          // Process referral rewards if eligible
          if (userData.referredBy && !userData.referralClaimed) {
            processReferralReward(userData, firebaseUser.uid);
          }
          
          // Immediate redirect to admin for battlegrid2.0@gmail.com, or home for others
          if (location.pathname === '/login' || location.pathname === '/signup' || location.pathname === '/') {
            if (firebaseUser.email?.toLowerCase().trim() === 'battlegrid2.0@gmail.com') {
              console.log("Admin logged in -> Opening Admin Panel directly...");
              navigate('/admin', { replace: true });
            } else {
              console.log("Redirecting to home...");
              navigate('/home', { replace: true });
            }
          }
        }, (error) => {
          console.warn("User onSnapshot warning, using fast fallback:", error);
          const isAdmin = firebaseUser.email?.toLowerCase().trim() === 'battlegrid2.0@gmail.com';
          setUser({
            id: firebaseUser.uid,
            username: isAdmin ? 'Admin' : (firebaseUser.displayName || 'Gamer'),
            email: firebaseUser.email || '',
            phone: '9999999999',
            ...DEFAULT_USER_DATA,
            isAdmin: isAdmin
          } as User);
          setIsLoggedIn(true);
          setLoading(false);
          if (location.pathname === '/login' || location.pathname === '/signup' || location.pathname === '/') {
            navigate(isAdmin ? '/admin' : '/home', { replace: true });
          }
        });

        // Real-time registrations listener for instant match start notifications
        try {
          const q = query(collection(db, 'registrations'), where('userId', '==', firebaseUser.uid));
          unsubscribeRegs = onSnapshot(q, (regSnap) => {
            const matchIds = regSnap.docs
              .map(d => d.data().tournamentId || d.data().matchId)
              .filter(Boolean);
            setJoinedMatchIds(matchIds);
          }, (err) => {
            console.warn("Registrations listener notice:", err);
          });
        } catch (error) {
          console.error("Error subscribing to registrations:", error);
        }
      } else {
        setIsLoggedIn(false);
        setUser(null);
        setJoinedMatchIds([]);
        if (!['/login', '/signup'].includes(location.pathname)) {
          navigate('/login', { replace: true });
        }
        setLoading(false);
      }
    });

    return () => {
      unsubscribeAuth();
      if (unsubscribeUser) unsubscribeUser();
      if (unsubscribeRegs) unsubscribeRegs();
    };
  }, []);

  // Back button protection: if authenticated, don't show login/signup screen
  useEffect(() => {
    if (isLoggedIn && user && (location.pathname === '/login' || location.pathname === '/signup' || location.pathname === '/')) {
      const isAdmin = user.email?.toLowerCase().trim() === 'battlegrid2.0@gmail.com';
      navigate(isAdmin ? '/admin' : '/home', { replace: true });
    }
  }, [isLoggedIn, user, location.pathname, navigate]);

  const handleLogin = () => {
    console.log("Redirecting to home...");
    navigate('/home');
  };

  const handleLogout = async () => {
    await auth.signOut();
    navigate('/login');
  };

  const handlePageChange = (page: Page, id?: string) => {
    let path = pageToPath[page];
    if (id) {
      if (page === Page.TOURNAMENTS) path = `${path}/${id}`;
      else if (page === Page.JOIN_MATCH) path = `${path}/${id}`;
      else if (page === Page.MATCH_DETAILS) path = `${path}/${id}`;
      else if (page === Page.ADMIN_USER_PROFILE) path = `${path}/${id}`;
      else if (page === Page.ADMIN_EDIT_MATCH) path = `${path}/${id}`;
      else if (page === Page.ADMIN_CREATE_MATCH) path = `${path}/${id}`;
      else if (page === Page.GAME_MODES) path = `${path}/${id}`;
    }
    navigate(path);
  };

  const handleJoinSuccess = (matchId: string) => {
    setJoinedMatchIds(prev => [...prev, matchId]);
  };

  const processReferralReward = async (currentUser: any, uid: string) => {
    if (!currentUser.referredBy || currentUser.referralClaimed) return;

    console.log("Checking referral reward for user:", currentUser.username);
    try {
      const settingsSnap = await getDoc(doc(db, 'appSettings', 'referral_support'));
      if (!settingsSnap.exists()) return;
      const settings = settingsSnap.data();
      const refSettings = settings.referral;
      if (!refSettings) return;

      // Find referrer by username
      const q = query(collection(db, 'users'), where('username', '==', currentUser.referredBy));
      const referrerSnap = await getDocs(q);
      if (referrerSnap.empty) {
        console.log("Referrer not found:", currentUser.referredBy);
        // Mark as claimed to stop checking
        await updateDoc(doc(db, 'users', uid), { referralClaimed: true });
        return;
      }

      // Device check: Are there other users with this deviceId who already claimed?
      const qDevice = query(collection(db, 'users'), where('deviceId', '==', currentUser.deviceId || 'unknown'), where('referralClaimed', '==', true));
      const deviceSnap = await getDocs(qDevice);
      if (!deviceSnap.empty) {
        console.warn("Fraud alert: Device already used for referral reward");
        await updateDoc(doc(db, 'users', uid), { referralClaimed: true });
        return;
      }
      
      const referrerDoc = referrerSnap.docs[0];
      const referrerId = referrerDoc.id;

      // Reward Referrer
      const refReward = refSettings.perReferralReward || 0;
      if (refReward > 0) {
        const referrerUpdate: any = {};
        if (refSettings.rewardType === 'deposit') {
          referrerUpdate['wallet.deposit'] = increment(refReward);
        } else if (refSettings.rewardType === 'bonus') {
          referrerUpdate['wallet.bonus'] = increment(refReward);
        } else if (refSettings.rewardType === 'both') {
          const depPercentage = refSettings.depositPercentage || 50;
          const depAmount = (refReward * depPercentage) / 100;
          const bonusAmount = refReward - depAmount;
          referrerUpdate['wallet.deposit'] = increment(depAmount);
          referrerUpdate['wallet.bonus'] = increment(bonusAmount);
        }
        
        const batch = writeBatch(db);
        batch.update(doc(db, 'users', referrerId), referrerUpdate);
        
        // Referrer Transaction
        batch.set(doc(collection(db, 'transactions')), {
          userId: referrerId,
          type: 'bonus',
          amount: refReward,
          status: 'completed',
          title: `Referral Reward: ${currentUser.username}`,
          createdAt: serverTimestamp()
        });

        // 2. Reward New User
        const newUserReward = refSettings.newUserReward || 0;
        if (newUserReward > 0) {
          batch.update(doc(db, 'users', uid), {
            'wallet.bonus': increment(newUserReward),
            referralClaimed: true
          });
          
          batch.set(doc(collection(db, 'transactions')), {
            userId: uid,
            type: 'bonus',
            amount: newUserReward,
            status: 'completed',
            title: `Referral Bonus (from ${currentUser.referredBy})`,
            createdAt: serverTimestamp()
          });
        } else {
          batch.update(doc(db, 'users', uid), { referralClaimed: true });
        }

        await batch.commit();
        console.log("Referral rewards processed successfully");
      }
    } catch (err) {
      console.error("Error processing referral reward:", err);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center">
        <div className="w-12 h-12 border-4 border-purple-600 border-t-transparent rounded-full animate-spin" />
        <p className="mt-4 text-xs font-black uppercase tracking-widest text-neutral-500">Initializing...</p>
      </div>
    );
  }

  // Derive currentPage for components that still need it
  const currentPath = location.pathname;
  let currentPage = Page.HOME;
  for (const [path, page] of Object.entries(pathToPage)) {
    if (currentPath.startsWith(path)) {
      currentPage = page;
      break;
    }
  }

  // Protected route wrapper
  const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
    if (!isLoggedIn && !loading) {
      return <Navigate to="/login" replace />;
    }
    if (!user && isLoggedIn) {
      return (
        <div className="flex flex-col items-center justify-center pt-24">
          <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          <p className="mt-4 text-[10px] font-black uppercase tracking-widest text-neutral-500">Loading profile...</p>
        </div>
      );
    }
    return <>{children}</>;
  };

  const AdminProtectedRoute = ({ children }: { children: React.ReactNode }) => {
    if (!isLoggedIn && !loading) {
      return <Navigate to="/login" replace />;
    }
    if (loading) {
      return (
        <div className="flex flex-col items-center justify-center pt-24">
          <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          <p className="mt-4 text-[10px] font-black uppercase tracking-widest text-neutral-500">Loading admin...</p>
        </div>
      );
    }
    const isAdmin = user?.email?.toLowerCase().trim() === 'battlegrid2.0@gmail.com';
    if (!isAdmin) {
      console.warn("Unauthorized attempt to access Admin Panel. Redirecting to home.");
      return <Navigate to="/home" replace />;
    }
    return <>{children}</>;
  };

  // Pages that display header/nav
  const showChrome = isLoggedIn && !['/login', '/signup'].includes(location.pathname);
  const showHeader = showChrome && !['/home', '/tournaments', '/match/', '/match-details/', '/wallet/add', '/wallet/withdraw', '/admin', '/referral', '/profile/details', '/profile/stats', '/game-modes', '/profile'].some(p => location.pathname.startsWith(p));
  const showNav = showChrome && !['/match/', '/match-details/', '/admin/match/'].some(p => location.pathname.startsWith(p));

  return (
    <div className="min-h-screen bg-background relative selection:bg-primary/20">
      <ScrollToTop />
      <GlobalNotificationListener 
        user={user} 
        joinedMatchIds={joinedMatchIds} 
        onPageChange={handlePageChange} 
      />
      {showHeader && <Header user={user!} onPageChange={handlePageChange} />}
      
      <main className="mx-auto max-w-lg min-h-screen bg-background overflow-x-hidden">
        <AnimatePresence mode="wait">
          <motion.div
            key={location.pathname.split('/')[1]} // Transition based on base path
            initial={{ opacity: 0, x: 10 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -10 }}
            transition={{ duration: 0.2 }}
            className="w-full"
          >
            <Routes location={location}>
              <Route path="/" element={<Navigate to="/home" replace />} />
              <Route path="/login" element={<Auth onLogin={handleLogin} />} />
              <Route path="/signup" element={<Auth onLogin={handleLogin} />} />
              
              <Route path="/home" element={
                <ProtectedRoute>
                  <Home user={user} onPageChange={handlePageChange} joinedMatchIds={joinedMatchIds} />
                </ProtectedRoute>
              } />

              <Route path="/game-modes/:gameId" element={
                <ProtectedRoute>
                  <GameModes onPageChange={handlePageChange} />
                </ProtectedRoute>
              } />
              
              <Route path="/tournaments" element={
                <ProtectedRoute>
                  <Tournaments onPageChange={handlePageChange} joinedMatchIds={joinedMatchIds} />
                </ProtectedRoute>
              } />
              
              <Route path="/tournaments/:gameId" element={
                <ProtectedRoute>
                  <Tournaments onPageChange={handlePageChange} joinedMatchIds={joinedMatchIds} />
                </ProtectedRoute>
              } />

              <Route path="/match-details/:id" element={
                <ProtectedRoute>
                  <MatchDetails 
                    user={user!}
                    onPageChange={handlePageChange} 
                    joinedMatchIds={joinedMatchIds}
                  />
                </ProtectedRoute>
              } />

              <Route path="/match/:id" element={
                <ProtectedRoute>
                  <JoinMatch 
                    user={user!}
                    onPageChange={handlePageChange} 
                    joinedMatchIds={joinedMatchIds}
                    onJoinSuccess={handleJoinSuccess}
                  />
                </ProtectedRoute>
              } />

              <Route path="/wallet" element={
                <ProtectedRoute>
                  <WalletPage user={user} onPageChange={handlePageChange} />
                </ProtectedRoute>
              } />

              <Route path="/wallet/add" element={
                <ProtectedRoute>
                  <AddMoney onPageChange={handlePageChange} />
                </ProtectedRoute>
              } />

              <Route path="/wallet/withdraw" element={
                <ProtectedRoute>
                  <Withdraw user={user} onPageChange={handlePageChange} />
                </ProtectedRoute>
              } />

              <Route path="/profile" element={
                <ProtectedRoute>
                  <ProfilePage user={user} onPageChange={handlePageChange} onLogout={handleLogout} />
                </ProtectedRoute>
              } />

              <Route path="/profile/details" element={
                <ProtectedRoute>
                  <ProfileDetails user={user!} onPageChange={handlePageChange} />
                </ProtectedRoute>
              } />

              <Route path="/profile/stats" element={
                <ProtectedRoute>
                  <GameStats user={user!} onPageChange={handlePageChange} />
                </ProtectedRoute>
              } />

              <Route path="/referral" element={
                <ProtectedRoute>
                  <ReferralPage user={user!} onPageChange={handlePageChange} />
                </ProtectedRoute>
              } />

              <Route path="/admin" element={
                <AdminProtectedRoute>
                  <AdminPage onPageChange={handlePageChange} />
                </AdminProtectedRoute>
              } />

              <Route path="/admin/user/:id" element={
                <AdminProtectedRoute>
                  <AdminUserDetail onPageChange={handlePageChange} />
                </AdminProtectedRoute>
              } />

              <Route path="/admin/match/edit/:id" element={
                <AdminProtectedRoute>
                  <AdminEditMatch onPageChange={handlePageChange} />
                </AdminProtectedRoute>
              } />

              <Route path="/admin/match/create" element={
                <AdminProtectedRoute>
                  <AdminCreateMatch onPageChange={handlePageChange} />
                </AdminProtectedRoute>
              } />

              <Route path="/admin/match/create/:duplicateId" element={
                <AdminProtectedRoute>
                  <AdminCreateMatch onPageChange={handlePageChange} />
                </AdminProtectedRoute>
              } />

              <Route path="/admin/modes" element={
                <AdminProtectedRoute>
                  <AdminModes onPageChange={handlePageChange} />
                </AdminProtectedRoute>
              } />

              <Route path="/leaderboard" element={
                <ProtectedRoute>
                  <Leaderboard />
                </ProtectedRoute>
              } />

              <Route path="*" element={<Navigate to="/home" replace />} />
            </Routes>
          </motion.div>
        </AnimatePresence>
      </main>

      {showNav && (
        <BottomNav 
          currentPage={currentPage} 
          onPageChange={handlePageChange} 
          user={user}
        />
      )}
      
      {/* Global Background Glow */}
      <div className="fixed top-0 left-1/2 -translate-x-1/2 w-full max-w-lg h-full pointer-events-none -z-10 overflow-hidden">
        <div className="absolute top-[-10%] left-[-20%] w-[80%] h-[40%] bg-primary/10 blur-[120px] rounded-full" />
        <div className="absolute bottom-[-10%] right-[-20%] w-[80%] h-[40%] bg-secondary/10 blur-[120px] rounded-full" />
      </div>
    </div>
  );
}
