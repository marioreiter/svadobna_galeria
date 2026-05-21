import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  User as UserIcon, 
  Image as ImageIcon, 
  LogOut, 
  Loader2, 
  Plus,
  RefreshCw,
  Download,
  Clock,
  History,
  CheckCircle2,
  Lock,
  MessageCircle,
  Heart,
  Send,
  Trash2,
  X,
  ChevronLeft,
  ChevronRight,
  Maximize2,
  ArrowDownAZ,
  ArrowUpZA,
  ZoomIn,
  ZoomOut,
  Search,
  LayoutGrid,
  List
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { 
  collection, 
  query, 
  orderBy, 
  onSnapshot, 
  doc, 
  getDoc, 
  setDoc, 
  deleteDoc, 
  updateDoc,
  arrayUnion,
  arrayRemove,
  addDoc,
  Timestamp,
  serverTimestamp,
  increment
} from 'firebase/firestore';
import { initAuth, googleSignIn, logout, db } from './lib/auth';
import type { User } from 'firebase/auth';

interface PhotoFile {
  id: string;
  thumbnailLink: string;
  webContentLink: string;
  nickname: string;
  dateTaken: string;
  createdTime: string;
  uid?: string;
  likes?: string[];
  commentCount?: number;
}

interface Comment {
  id: string;
  uid: string;
  nickname: string;
  text: string;
  createdAt: any;
}

interface UploadProgress {
  isUploading: boolean;
  percentage: number;
  speed: string;
  estimatedTime: string;
  fileName: string;
  current: number;
  total: number;
}

interface PhotoMetadata {
  nickname: string;
  dateTaken: string;
  uid?: string;
}

const getThemeClass = () => {
  const hour = new Date().getHours();
  if (hour >= 5 && hour < 10) return 'bg-[#FFF9F0]';
  if (hour >= 10 && hour < 17) return 'bg-[#F9F7F2]';
  if (hour >= 17 && hour < 21) return 'bg-[#FDF2E9]';
  return 'bg-[#F2F1EC]';
};

export function FloatingBackground({ photos }: { photos: PhotoFile[] }) {
  const defaultPhotos = [
    'https://images.unsplash.com/photo-1511795409834-ef04bbd61622?auto=format&fit=crop&q=80&w=800',
    'https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&q=80&w=800',
    'https://images.unsplash.com/photo-1519225495045-3b363d578fe1?auto=format&fit=crop&q=80&w=800',
    'https://images.unsplash.com/photo-1532712938310-34cb3982ef74?auto=format&fit=crop&q=80&w=800',
    'https://images.unsplash.com/photo-1460364154851-6190299617d5?auto=format&fit=crop&q=80&w=800',
    'https://images.unsplash.com/photo-1515934751635-c81c6bc9a2d8?auto=format&fit=crop&q=80&w=800',
    'https://images.unsplash.com/photo-1465495910483-0d674b09ec54?auto=format&fit=crop&q=80&w=800'
  ];

  const backgroundPhotos = photos.length > 0 
    ? photos.slice(0, 15) 
    : defaultPhotos.map((url, i) => ({ id: `def-${i}`, thumbnailLink: url } as PhotoFile));
    
  const themeClass = getThemeClass();

  return (
    <div className={`fixed inset-0 overflow-hidden pointer-events-none -z-10 ${themeClass} transition-colors duration-1000`}>
      {backgroundPhotos.map((photo, i) => (
        <motion.div
          key={`bg-${photo.id}-${i}`}
          initial={{ 
            x: `${Math.random() * 100}%`, 
            y: `${Math.random() * 100}%`,
            scale: 0.5 + Math.random() * 0.5,
            opacity: 0,
            rotate: Math.random() * 360
          }}
          animate={{ 
            x: [
              `${Math.random() * 100}%`, 
              `${(Math.random() * 80) + 10}%`, 
              `${Math.random() * 100}%`
            ],
            y: [
              `${Math.random() * 100}%`, 
              `${(Math.random() * 80) + 10}%`, 
              `${Math.random() * 100}%`
            ],
            opacity: [0.05, 0.15, 0.05],
            rotate: [0, 45, -45, 0]
          }}
          transition={{
            duration: 50 + Math.random() * 50,
            repeat: Infinity,
            ease: "easeInOut",
            delay: i * 2,
          }}
          className="absolute w-32 h-44 md:w-64 md:h-80"
        >
          {photo.thumbnailLink ? (
            <div className="w-full h-full p-2 bg-white/20 backdrop-blur-md rounded-[20px] shadow-2xl border border-white/30 rotate-3">
              <img
                src={photo.thumbnailLink.includes('googleusercontent') 
                  ? photo.thumbnailLink.replace('s220', 's400') 
                  : photo.thumbnailLink}
                alt=""
                className="w-full h-full object-cover rounded-[12px] blur-xl"
                referrerPolicy="no-referrer"
              />
            </div>
          ) : null}
        </motion.div>
      ))}
      <div className="absolute inset-0 bg-gradient-to-tr from-bento-bg via-transparent to-white/30 mix-blend-overlay" />
    </div>
  );
}

export function UploadProgressOverlay({ progress }: { progress: UploadProgress }) {
  return (
    <div className="bg-white rounded-[32px] md:rounded-[40px] p-6 md:p-8 shadow-2xl border border-bento-border w-full space-y-4 md:space-y-6 text-center">
      <div className="relative w-24 h-24 md:w-32 md:h-32 mx-auto">
        <svg className="w-full h-full transform -rotate-90">
          <circle cx="48" cy="48" r="42" stroke="currentColor" strokeWidth="6" fill="transparent" className="text-bento-bg md:hidden" />
          <circle cx="64" cy="64" r="58" stroke="currentColor" strokeWidth="8" fill="transparent" className="text-bento-bg hidden md:block" />
          <motion.circle
            cx="48" cy="48" r="42" stroke="currentColor" strokeWidth="6" fill="transparent"
            initial={{ strokeDasharray: "263.8", strokeDashoffset: "263.8" }}
            animate={{ strokeDashoffset: 263.8 - (263.8 * progress.percentage) / 100 }}
            className="text-bento-accent md:hidden"
            strokeLinecap="round"
          />
          <motion.circle
            cx="64" cy="64" r="58" stroke="currentColor" strokeWidth="8" fill="transparent"
            initial={{ strokeDasharray: "364.4", strokeDashoffset: "364.4" }}
            animate={{ strokeDashoffset: 364.4 - (364.4 * progress.percentage) / 100 }}
            className="text-bento-accent hidden md:block"
            strokeLinecap="round"
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-2xl md:text-3xl font-serif italic text-bento-dark">{progress.percentage}%</span>
          <span className="text-[8px] md:text-[10px] text-bento-muted uppercase font-bold tracking-widest">{progress.current} / {progress.total}</span>
        </div>
      </div>
      <div className="space-y-1">
        <h3 className="text-lg md:text-xl font-serif italic">Nahrávam spomienky...</h3>
        <p className="text-[9px] md:text-[10px] text-bento-muted uppercase tracking-widest truncate px-4">{progress.fileName}</p>
      </div>
      <div className="grid grid-cols-2 gap-3 md:gap-4">
        <div className="bg-bento-bg rounded-2xl p-3">
          <p className="text-[9px] uppercase tracking-tighter text-bento-muted font-bold">Rýchlosť</p>
          <p className="text-sm font-mono font-medium text-bento-dark">{progress.speed}</p>
        </div>
        <div className="bg-bento-bg rounded-2xl p-3">
          <p className="text-[9px] uppercase tracking-tighter text-bento-muted font-bold">Zostáva</p>
          <p className="text-sm font-mono font-medium text-bento-dark">{progress.estimatedTime}</p>
        </div>
      </div>
    </div>
  );
}

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isAuthLoading, setIsAuthLoading] = useState(true);
  const [isGuest, setIsGuest] = useState(localStorage.getItem('wedding_is_guest') === 'true');
  const [nickname, setNickname] = useState(localStorage.getItem('wedding_nickname') || '');
  const [photos, setPhotos] = useState<PhotoFile[]>([]);
  const [sortOrder, setSortOrder] = useState<'desc' | 'asc'>('desc');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [selectedPhotoIndex, setSelectedPhotoIndex] = useState<number | null>(null);
  const [zoomScale, setZoomScale] = useState(1);
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState('');
  const [isLoadingPhotos, setIsLoadingPhotos] = useState(false);
  const [folderId, setFolderId] = useState<string | null>(localStorage.getItem('wedding_folder_id'));
  const [guestToken, setGuestToken] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isSyncing, setIsSyncing] = useState(false);
  const [showThankYou, setShowThankYou] = useState(false);
  const [guestUid] = useState(() => {
    let id = localStorage.getItem('wedding_guest_uid');
    if (!id) {
      id = 'guest_' + Math.random().toString(36).substring(2, 11);
      localStorage.setItem('wedding_guest_uid', id);
    }
    return id;
  });
  const [uploadedPhotoIds, setUploadedPhotoIds] = useState<string[]>(() => {
    try {
      const stored = localStorage.getItem('wedding_uploaded_ids');
      return stored ? JSON.parse(stored) : [];
    } catch { return []; }
  });
  const [uploadProgress, setUploadProgress] = useState<UploadProgress>({
    isUploading: false, percentage: 0, speed: '0 KB/s', estimatedTime: '...', fileName: '', current: 0, total: 0
  });
  const [photoToDelete, setPhotoToDelete] = useState<PhotoFile | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showUploadModal, setShowUploadModal] = useState(false);

  const isNicknameValid = nickname.trim().length > 0;

  const isAdmin = user?.email === 'majo.reiter@gmail.com';

  const handleDownload = (e: React.MouseEvent, url: string) => {
    e.stopPropagation();
    e.preventDefault();
    
    // Create a temporary hidden link to trigger download/open in new tab
    // This often avoids iframe-related navigation issues that might cause reloads
    const link = document.createElement('a');
    link.href = url;
    link.target = '_blank';
    link.rel = 'noopener noreferrer';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  useEffect(() => {
    localStorage.setItem('wedding_uploaded_ids', JSON.stringify(uploadedPhotoIds));
  }, [uploadedPhotoIds]);

  useEffect(() => {
    const unsubscribe = initAuth(
      (u, t) => { setUser(u); setToken(t); setIsAuthLoading(false); },
      () => { setUser(null); setToken(null); setIsAuthLoading(false); }
    );
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (selectedPhotoIndex === null) return;
      if (e.key === 'Escape') setSelectedPhotoIndex(null);
      if (e.key === 'ArrowLeft') navigatePhoto(-1);
      if (e.key === 'ArrowRight') navigatePhoto(1);
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedPhotoIndex, photos]);

  useEffect(() => {
    setZoomScale(1);
    if (selectedPhotoIndex === null) {
      setComments([]);
      return;
    }
    const photo = photos[selectedPhotoIndex];
    if (!photo) return;

    const q = query(collection(db, 'photos', photo.id, 'comments'), orderBy('createdAt', 'asc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setComments(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Comment[]);
    });
    return () => unsubscribe();
  }, [selectedPhotoIndex, photos]);

  const toggleLike = async (photo: PhotoFile) => {
    const currentUid = user?.uid || guestUid;
    const isLiked = photo.likes?.includes(currentUid);
    try {
      await updateDoc(doc(db, 'photos', photo.id), {
        likes: isLiked ? arrayRemove(currentUid) : arrayUnion(currentUid)
      });
    } catch (err) { 
      handleFirestoreError(err, 'updateDoc', `photos/${photo.id}`);
    }
  };

  const postComment = async () => {
    if (!newComment.trim() || selectedPhotoIndex === null) return;
    const photo = photos[selectedPhotoIndex];
    if (!photo) return;
    
    if (!nickname.trim()) {
      alert('Prosím zadajte svoju prezývku pred komentovaním.');
      return;
    }

    const text = newComment.trim();
    setNewComment('');
    
    try {
      await addDoc(collection(db, 'photos', photo.id, 'comments'), {
        uid: user?.uid || guestUid,
        nickname: nickname || 'Hosť',
        text,
        createdAt: serverTimestamp()
      });
      // Increment comment count on the photo document
      await updateDoc(doc(db, 'photos', photo.id), {
        commentCount: increment(1)
      });
    } catch (err) { 
      handleFirestoreError(err, 'addDoc', `photos/${photo.id}/comments`);
      setNewComment(text);
    }
  };

  const navigatePhoto = (step: number) => {
    if (selectedPhotoIndex === null) return;
    setZoomScale(1);
    let newIndex = selectedPhotoIndex + step;
    if (newIndex < 0) newIndex = photos.length - 1;
    if (newIndex >= photos.length) newIndex = 0;
    setSelectedPhotoIndex(newIndex);
  };

  useEffect(() => {
    // Fetch config for everyone to get the global folderId
    fetchGlobalConfig();
    
    if (user && !user.isAnonymous && token) {
      // Primary sync for admin
      ensureFolderAndFetchPhotos();
      
      const interval = setInterval(() => {
        ensureFolderAndFetchPhotos();
      }, 60000);
      return () => clearInterval(interval);
    }
  }, [user, token]);

  useEffect(() => {
    setIsLoadingPhotos(true);
    // Listen to all photos and sort client-side based on selected order
    const q = query(collection(db, 'photos'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const photoList = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as PhotoFile[];
      // Client-side sort by createdTime, with fallback for missing dates
      photoList.sort((a, b) => {
        const dateA = new Date(a.createdTime || a.dateTaken || 0).getTime();
        const dateB = new Date(b.createdTime || b.dateTaken || 0).getTime();
        return sortOrder === 'desc' ? dateB - dateA : dateA - dateB;
      });
      setPhotos(photoList);
      setIsLoadingPhotos(false);
    }, (err) => {
      console.error('Firestore listener error:', err);
      setIsLoadingPhotos(false);
    });
    return () => unsubscribe();
  }, [sortOrder]);

  const fetchGlobalConfig = async () => {
    try {
      const configDoc = await getDoc(doc(db, 'config', 'wedding'));
      if (configDoc.exists()) {
        const data = configDoc.data();
        if (data && data.folderId) {
          setFolderId(data.folderId);
          localStorage.setItem('wedding_folder_id', data.folderId);
        }
        if (data && data.guestToken) {
          setGuestToken(data.guestToken);
        }
      }
    } catch (err) { console.error('Error fetching global config:', err); }
  };

  const handleFirestoreError = (error: any, operation: string, path: string) => {
    console.error(`Firebase [${operation}] at [${path}] failed:`, error);
    const errInfo = {
      error: error?.message || String(error),
      code: error?.code,
      operation,
      path,
      user: user ? { uid: user.uid, isAnonymous: user.isAnonymous } : 'no user'
    };
    return JSON.stringify(errInfo, null, 2);
  };

  const ensureFolderAndFetchPhotos = async (manualSync = false) => {
    if (!token) return;
    if (manualSync) setIsSyncing(true);
    try {
      const folderRes = await fetch('/api/ensure-folder', { method: 'POST', headers: { Authorization: `Bearer ${token}` } });
      const folderData = await folderRes.json();
      if (!folderData.folderId) throw new Error('Could not find folder');
      const targetFolderId = folderData.folderId;
      
      // Update state and storage
      setFolderId(targetFolderId);
      localStorage.setItem('wedding_folder_id', targetFolderId);
      
      // Sync to Firestore config ONLY if we are the designated admin OR if it is completely missing
      try {
        const configDoc = await getDoc(doc(db, 'config', 'wedding'));
        const existingGlobalFolderId = configDoc.exists() ? configDoc.data()?.folderId : null;
        
        if (isAdmin || !existingGlobalFolderId) {
          await setDoc(doc(db, 'config', 'wedding'), { 
            folderId: targetFolderId,
            guestToken: token // Share the current token for guest use
          }, { merge: true });
          console.log('Updated global wedding folder ID and guest token');
        }
      } catch (e) {
        // Silently fail if not admin, but log it
        console.warn('Could not update global config (expected if not admin):', e);
      }

      const res = await fetch(`/api/photos?folderId=${targetFolderId}`, { headers: { Authorization: `Bearer ${token}` } });
      const data = await res.json();
      
      console.log(`Sync: Found ${data.files?.length || 0} files on Drive`);

      if (data.files && Array.isArray(data.files)) {
        // Sync each file to Firestore
        const syncPromises = data.files.map(async (dr: any) => {
          const meta = parseMetadata(dr.description);
          try {
            await setDoc(doc(db, 'photos', dr.id), {
              id: dr.id,
              uid: meta?.uid || '',
              thumbnailLink: dr.thumbnailLink || '',
              webContentLink: dr.webContentLink || '',
              nickname: meta?.nickname || 'Hosť',
              dateTaken: meta?.dateTaken || dr.createdTime || new Date().toISOString(),
              createdTime: dr.createdTime || new Date().toISOString(),
              likes: [],
              commentCount: 0
            }, { merge: true });
          } catch (e) {
            console.error(`Failed to sync photo ${dr.id}:`, e);
          }
        });
        await Promise.all(syncPromises);
      }
    } catch (err: any) { 
      console.error('Error syncing:', err);
      // If it's a JSON error from our handler, try to make it more readable
      try {
        const parsed = JSON.parse(err.message);
        console.error('Detailed Sync Error:', parsed);
      } catch { /* not JSON */ }
    } finally { 
      if (manualSync) setIsSyncing(false); 
    }
  };

  const handleLogin = async () => {
    try {
      const result = await googleSignIn();
      if (result) {
        setUser(result.user);
        setToken(result.accessToken);
      }
    } catch (err) { console.error('Login failed:', err); }
  };

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;
    
    // Determine active token: prefer user token, fallback to guestToken from config
    const activeToken = token || guestToken;

    if (!activeToken) {
      if (confirm('Pre nahrávanie fotiek sa musíte prihlásiť cez Google. Chcete sa prihlásiť teraz?')) {
        handleLogin();
      }
      return;
    }

    if (!folderId) {
      alert('Priečinok sa inicializuje, skúste o moment.');
      return;
    }
    if (!nickname.trim()) { alert('Zadajte prezývku pred nahrávaním.'); return; }

    localStorage.setItem('wedding_nickname', nickname);
    setShowUploadModal(false);
    
    // Calculate total size for progress tracking
    const totalBytes = files.reduce((acc, f) => acc + f.size, 0);
    let bytesUploadedBefore = 0;

    setUploadProgress(prev => ({ 
      ...prev, 
      isUploading: true, 
      current: 1, 
      total: files.length, 
      percentage: 0,
      fileName: files[0].name
    }));

    try {
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        setUploadProgress(prev => ({ ...prev, current: i + 1, fileName: file.name }));
        
        await new Promise<void>((resolve, reject) => {
          const formData = new FormData();
          formData.append('photo', file);
          formData.append('nickname', nickname);
          formData.append('folderId', folderId);
          formData.append('uid', user?.uid || guestUid);
          
          const startTime = Date.now();
          const xhr = new XMLHttpRequest();
          
          xhr.upload.addEventListener('progress', (ev) => {
            if (ev.lengthComputable) {
              const currentTotalUploaded = bytesUploadedBefore + ev.loaded;
              const percentage = Math.min(99, Math.round((currentTotalUploaded / totalBytes) * 100));
              
              const elapsed = (Date.now() - startTime) / 1000;
              const fileSpeedBps = ev.loaded / elapsed;
              let speedStr = `${(fileSpeedBps / 1024).toFixed(1)} KB/s`;
              if (fileSpeedBps > 1024 * 1024) speedStr = `${(fileSpeedBps / (1024 * 1024)).toFixed(1)} MB/s`;
              
              const remainingBytes = totalBytes - currentTotalUploaded;
              const remSec = fileSpeedBps > 0 ? remainingBytes / fileSpeedBps : 0;
              const remStr = remSec > 60 ? `${Math.floor(remSec / 60)}m ${Math.round(remSec % 60)}s` : `${Math.round(remSec)}s`;
              
              setUploadProgress(p => ({ ...p, percentage, speed: speedStr, estimatedTime: remStr }));
            }
          });
          
          xhr.onload = async () => {
            if (xhr.status >= 200 && xhr.status < 300) {
              try {
                const data = JSON.parse(xhr.responseText);
                const dr = data.file;
                const meta = parseMetadata(dr.description);
                await setDoc(doc(db, 'photos', dr.id), {
                  id: dr.id,
                  uid: user?.uid || guestUid,
                  thumbnailLink: dr.thumbnailLink || '',
                  webContentLink: dr.webContentLink || '',
                  nickname: meta?.nickname || nickname,
                  dateTaken: meta?.dateTaken || new Date().toISOString(),
                  createdTime: dr.createdTime || new Date().toISOString(),
                  likes: [],
                  commentCount: 0
                }, { merge: true });
                setUploadedPhotoIds(prev => [...new Set([...prev, dr.id])]);
                
                bytesUploadedBefore += file.size;
                resolve();
              } catch (e) { console.error('Upload handling error:', e); resolve(); }
            } else {
              reject(new Error(`Upload failed: ${xhr.status}`));
            }
          };
          
          xhr.onerror = () => reject(new Error('Network error'));
          xhr.open('POST', '/api/upload');
          xhr.setRequestHeader('Authorization', `Bearer ${activeToken}`);
          xhr.send(formData);
        });
      }
      
      setUploadProgress(p => ({ ...p, percentage: 100 }));
      confetti({ particleCount: 150, spread: 80, origin: { y: 0.6 }, colors: ['#D4AF37', '#ffffff'] });
      setShowThankYou(true);
    } catch (err) { 
      console.error('Upload error:', err);
      alert('Nahrávanie zlyhalo. Skúste to prosím znova.');
      resetUploadProgress();
      setShowThankYou(false);
    }
  };

  const closeUploadModal = () => {
    resetUploadProgress();
    setShowThankYou(false);
    setShowUploadModal(false);
  };

  const handleDeletePhoto = async () => {
    if (!photoToDelete || !token) {
      setPhotoToDelete(null);
      return;
    }

    setIsDeleting(true);
    try {
      await deletePhotoExecution(photoToDelete.id);
      setPhotoToDelete(null);
      setSelectedPhotoIndex(null);
    } catch (err: any) {
      alert('Vymazanie zlyhalo: ' + err.message);
    } finally {
      setIsDeleting(false);
    }
  };

  const deletePhotoExecution = async (photoId: string) => {
    if (!token) return;
    
    // 1. Delete from Drive via our API
    const res = await fetch(`/api/photos/${photoId}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}` }
    });

    if (!res.ok) {
      const errorData = await res.json().catch(() => ({ error: 'Unknown server error' }));
      throw new Error(errorData.error || `Server returned ${res.status}`);
    }

    // 2. Delete from Firestore
    await deleteDoc(doc(db, 'photos', photoId));
    
    // 3. Remove from local tracking
    setUploadedPhotoIds(prev => prev.filter(id => id !== photoId));
  };

  const resetUploadProgress = () => {
    setUploadProgress({ isUploading: false, percentage: 0, speed: '0 KB/s', estimatedTime: '...', fileName: '', current: 0, total: 0 });
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const parseMetadata = (desc?: string): PhotoMetadata | null => {
    if (!desc) return null;
    try { return JSON.parse(desc); } catch { return null; }
  };

  const formatDate = (ds: string) => {
    return new Date(ds).toLocaleString('sk-SK', { 
      day: '2-digit', 
      month: '2-digit', 
      year: 'numeric', 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  const themeClass = getThemeClass();

  if (isAuthLoading) {
    return <div className={`min-h-screen ${themeClass} flex items-center justify-center`}><Loader2 className="w-10 h-10 animate-spin text-bento-accent" /></div>;
  }

  const handleGuestEntry = () => {
    setIsGuest(true);
    localStorage.setItem('wedding_is_guest', 'true');
  };

  if (!user && !isGuest) {
    return (
      <div className={`min-h-screen ${themeClass} flex flex-col items-center justify-center p-6 text-center overflow-hidden relative transition-colors duration-1000`}>
        <FloatingBackground photos={photos} />
        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="max-w-md w-full space-y-8 md:space-y-12 relative z-10">
          <div className="flex justify-center">
            <motion.div animate={{ rotate: [0, 5, -5, 0] }} transition={{ repeat: Infinity, duration: 5 }} className="w-20 h-20 md:w-28 md:h-28 bg-white rounded-full flex items-center justify-center shadow-xl border border-bento-border relative group">
              <div className="absolute inset-2 border border-bento-accent/20 rounded-full"></div>
              <span className="text-3xl md:text-5xl font-serif italic text-bento-accent">BM</span>
            </motion.div>
          </div>
          <div className="space-y-2 md:space-y-4">
            <h1 className="text-3xl md:text-5xl font-serif text-bento-dark italic leading-tight">Barbora & Mário</h1>
            <p className="text-bento-muted font-serif italic text-base md:text-xl tracking-[0.1em] md:tracking-[0.2em] uppercase">8. 8. 2026, Košice</p>
          </div>
              <p className="text-bento-muted leading-relaxed font-serif italic text-base md:text-lg px-6">Zdieľajte s nami vaše spomienky z nášho veľkého dňa.</p>
          <div className="space-y-3 md:space-y-4 px-6">
            <button onClick={handleLogin} className="w-full flex items-center justify-center gap-3 md:gap-4 bg-white border border-bento-border py-4 px-6 rounded-[24px] hover:bg-gray-50 transition-all shadow-md group">
              <div className="w-5 h-5 flex-shrink-0">
                <svg viewBox="0 0 48 48" className="w-full h-full">
                  <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"></path>
                  <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"></path>
                  <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"></path>
                  <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"></path>
                </svg>
              </div>
              <span className="text-sm font-bold uppercase tracking-widest text-bento-dark text-center">Prihlásiť sa cez Google</span>
            </button>
            <button onClick={handleGuestEntry} className="w-full flex items-center justify-center gap-3 py-3 md:py-4 px-6 rounded-[24px] text-bento-muted hover:text-bento-dark hover:bg-white/50 transition-all font-bold uppercase tracking-widest text-[10px]">
              Pokračovať ako hosť
            </button>
            <p className="text-[10px] text-bento-muted uppercase tracking-[0.15em] font-medium">Všetky Google účty sú vítané · Registrácia je automatická</p>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen ${themeClass} text-bento-text font-sans flex flex-col relative overflow-x-hidden transition-colors duration-1000`}>
      <FloatingBackground photos={photos} />

      <AnimatePresence>
        {showUploadModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[150] flex items-center justify-center p-4 md:p-6 bg-bento-dark/40 backdrop-blur-md"
            onClick={() => !uploadProgress.isUploading && setShowUploadModal(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white rounded-[32px] md:rounded-[40px] p-6 md:p-10 shadow-2xl border border-bento-border max-w-md w-full relative"
            >
              <button 
                onClick={() => setShowUploadModal(false)}
                className="absolute top-6 right-6 p-2 text-bento-muted hover:text-bento-dark transition-colors"
                disabled={uploadProgress.isUploading}
              >
                <X className="w-5 h-5" />
              </button>

              <div className="flex justify-between items-start mb-2 md:mb-4">
                <h2 className="text-2xl md:text-3xl font-serif italic text-bento-dark">Pridaj spomienku</h2>
                {isSyncing && <Loader2 className="w-4 h-4 animate-spin text-bento-accent" />}
              </div>
              <p className="text-xs md:text-sm text-bento-muted italic mb-6 md:mb-8 text-left">Podeľ sa o svoje zábery do albumu.</p>
              
              <div className="space-y-4 md:space-y-6">
                <motion.div 
                  animate={!isNicknameValid ? { x: [0, -1, 1, -1, 1, 0] } : {}}
                  transition={{ repeat: !isNicknameValid ? Infinity : 0, duration: 4 }}
                  className="space-y-1 md:space-y-2"
                >
                  <label className="text-[8px] md:text-[10px] uppercase font-bold tracking-[0.1em] md:tracking-[0.2em] text-bento-muted ml-2">1. Tvoja prezývka</label>
                  <div className="relative">
                    <UserIcon className={`absolute left-4 md:left-5 top-1/2 -translate-y-1/2 w-4 h-4 transition-colors ${!isNicknameValid ? 'text-bento-accent' : 'text-bento-muted'}`} />
                    <input 
                      type="text" 
                      placeholder="napr. Sesternica Lenka" 
                      value={nickname} 
                      onChange={(e) => setNickname(e.target.value)} 
                      className={`w-full pl-10 md:pl-14 pr-4 md:pr-6 py-3 md:py-4 rounded-[16px] md:rounded-[24px] bg-bento-bg border-2 transition-all placeholder:text-[#BBB4A5] text-xs md:text-base font-serif italic focus:ring-2 focus:ring-bento-accent/10 ${!isNicknameValid ? 'border-bento-accent/40 shadow-sm' : 'border-transparent'}`}
                    />
                  </div>
                </motion.div>

                <div className="space-y-1 md:space-y-2">
                  <label className={`text-[8px] md:text-[10px] uppercase font-bold tracking-[0.1em] md:tracking-[0.2em] ml-2 transition-colors ${isNicknameValid ? 'text-bento-muted' : 'text-gray-300'}`}>2. Vyber fotografie</label>
                  <div 
                    onClick={() => isNicknameValid && fileInputRef.current?.click()} 
                    className={`flex flex-col items-center justify-center border-2 border-dashed rounded-[24px] md:rounded-[40px] py-6 md:py-16 transition-all group relative overflow-hidden ${
                      isNicknameValid 
                        ? 'border-bento-accent/30 bg-[#FFFDF9] cursor-pointer hover:bg-[#FDF9F0] hover:border-bento-accent/50 shadow-sm' 
                        : 'border-gray-100 bg-gray-50/5 cursor-not-allowed opacity-30 grayscale'
                    }`}
                  >
                    <input type="file" accept="image/*" multiple className="hidden" ref={fileInputRef} onChange={handleUpload} disabled={!isNicknameValid} />
                    <div className={`w-10 h-10 md:w-20 md:h-20 rounded-full flex items-center justify-center mb-2 md:mb-6 shadow transition-all ${isNicknameValid ? 'bg-bento-accent text-white shadow-bento-accent/20 group-hover:scale-110' : 'bg-gray-100 text-gray-300 shadow-none'}`}>
                      <Plus className="w-5 h-5 md:w-10 md:h-10" />
                    </div>
                    <p className={`text-[12px] md:text-xl font-serif italic ${isNicknameValid ? 'text-bento-dark' : 'text-gray-300'}`}>
                      {isNicknameValid ? 'Nahraj zábery' : 'Zadaj meno'}
                    </p>
                    {isNicknameValid && <p className="text-[7px] md:text-[10px] text-bento-muted mt-1 md:mt-2 uppercase font-bold tracking-widest">Galéria / Kamera</p>}
                  </div>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence mode="wait">
        {photoToDelete && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[300] flex items-center justify-center p-6 bg-bento-dark/40 backdrop-blur-md"
            onClick={() => !isDeleting && setPhotoToDelete(null)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white rounded-[32px] md:rounded-[40px] p-6 md:p-10 shadow-2xl border border-bento-border max-w-sm w-full text-center space-y-6"
            >
              <div className="space-y-2">
                <h3 className="text-2xl md:text-3xl font-serif italic text-bento-dark leading-tight">Ste si istý?</h3>
                <p className="text-sm text-bento-muted italic">Táto fotografia bude natrvalo odstránená z albumu.</p>
              </div>

              <div className="relative aspect-[4/3] rounded-[24px] overflow-hidden border border-bento-border shadow-inner">
                <img 
                  src={photoToDelete.thumbnailLink.replace('s220', 's400')} 
                  className="w-full h-full object-cover" 
                  referrerPolicy="no-referrer"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <button
                  disabled={isDeleting}
                  onClick={() => setPhotoToDelete(null)}
                  className="py-3.5 bg-bento-bg text-bento-muted rounded-2xl font-bold uppercase tracking-widest text-[10px] hover:bg-bento-border transition-colors disabled:opacity-50 cursor-pointer"
                >
                  Zrušiť
                </button>
                <button
                  disabled={isDeleting}
                  onClick={handleDeletePhoto}
                  className="py-3.5 bg-red-500 text-white rounded-2xl font-bold uppercase tracking-widest text-[10px] shadow-lg shadow-red-500/30 hover:bg-red-600 transition-colors flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer"
                >
                  {isDeleting ? <Loader2 className="w-3 h-3 animate-spin" /> : <Trash2 className="w-3 h-3" />}
                  Vymazať
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
      <AnimatePresence>
        {uploadProgress.isUploading && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0, transition: { delay: 0.5 } }}
            className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-bento-dark/20 backdrop-blur-sm"
          >
            <AnimatePresence mode="wait">
              {showThankYou ? (
                <motion.div 
                  key="thank-you"
                  initial={{ scale: 0.8, opacity: 0, y: 20 }}
                  animate={{ scale: 1, opacity: 1, y: 0 }}
                  exit={{ scale: 1.1, opacity: 0 }}
                  className="bg-white rounded-[32px] md:rounded-[40px] p-6 md:p-10 shadow-2xl border border-bento-border max-w-sm w-full text-center space-y-4 md:space-y-6 mx-4"
                >
                  <motion.div 
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: "spring", damping: 12, delay: 0.2 }}
                    className="w-20 h-20 bg-green-50 rounded-full flex items-center justify-center mx-auto"
                  >
                    <CheckCircle2 className="w-10 h-10 text-green-500" />
                  </motion.div>
                  <div className="space-y-2">
                    <h3 className="text-3xl font-serif italic text-bento-dark leading-tight">Ďakujeme!</h3>
                    <p className="text-sm text-bento-muted italic">Vaše spomienky boli úspešne pridané do nášho spoločného albumu.</p>
                  </div>
                  <motion.button 
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={closeUploadModal}
                    className="w-full py-4 bg-bento-accent text-white rounded-2xl font-bold uppercase tracking-widest text-[10px] shadow-lg shadow-bento-accent/30 cursor-pointer"
                  >
                    Prezrieť fotky
                  </motion.button>
                </motion.div>
              ) : (
                <motion.div 
                  key="progress"
                  initial={{ scale: 0.9, y: 20 }}
                  animate={{ scale: 1, y: 0 }}
                  exit={{ scale: 0.8, opacity: 0 }}
                  className="w-full max-w-sm"
                >
                  <UploadProgressOverlay progress={uploadProgress} />
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        )}
      </AnimatePresence>

      <header className="flex justify-between items-center px-6 md:px-10 py-6 border-b border-bento-border bg-bento-bg/80 backdrop-blur-md sticky top-0 z-50">
        <div className="flex flex-col">
          <h1 className="text-2xl md:text-3xl font-serif italic text-bento-dark leading-none">Barbora & Mário</h1>
          <p className="text-[9px] tracking-widest uppercase text-bento-muted font-bold mt-1.5 opacity-70">8. 8. 2026, Košice</p>
        </div>
        <div className="flex items-center gap-4">
          <button 
            onClick={() => { 
              logout(); 
              setUser(null); 
              setIsGuest(false);
              localStorage.removeItem('wedding_is_guest');
              sessionStorage.removeItem('drive_access_token'); 
            }} 
            className="p-2.5 hover:bg-[#E9E5DC] rounded-full transition-colors border border-transparent hover:border-bento-border shadow-sm bg-white md:bg-transparent text-bento-dark"
          >
            <LogOut className="w-5 h-5" />
          </button>
        </div>
      </header>

      <main className="flex-1 max-w-7xl mx-auto w-full p-4 md:p-8">
        <section className={`w-full space-y-8 pb-10`}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
            <div className="bg-bento-accent rounded-[28px] md:rounded-[40px] p-6 md:p-8 text-white shadow-sm flex items-center justify-between group cursor-pointer" onClick={() => setShowUploadModal(true)}>
              <div>
                <div className="flex items-baseline gap-2">
                  <span className="text-5xl md:text-7xl font-serif italic">{photos.length}</span>
                  <span className="text-[8px] md:text-[10px] uppercase tracking-[0.25em] font-bold opacity-80">Momentov</span>
                </div>
                <p className="text-xs md:text-sm mt-1 md:mt-2 opacity-90 font-serif italic">V našom spoločnom albume</p>
              </div>
              <div className="w-12 h-12 md:w-16 md:h-16 rounded-full bg-white/20 flex items-center justify-center group-hover:scale-110 transition-transform">
                <Plus className="w-6 h-6 md:w-8 md:h-8" />
              </div>
            </div>
            <div 
              className="bg-bento-dark rounded-[28px] md:rounded-[40px] p-6 md:p-8 text-white shadow-sm cursor-pointer hover:bg-bento-dark/95 transition-colors group relative flex justify-between items-center overflow-hidden"
              onClick={() => {
                if (photos.length === 0) return;
                const latestPhoto = [...photos].sort((a, b) => 
                  new Date(b.createdTime || b.dateTaken || 0).getTime() - new Date(a.createdTime || a.dateTaken || 0).getTime()
                )[0];
                const latestIdx = photos.findIndex(p => p.id === latestPhoto.id);
                if (latestIdx !== -1) setSelectedPhotoIndex(latestIdx);
              }}
            >
              <div className="relative z-10 flex-1 min-w-0">
                <div className="flex items-center gap-3"><div className="w-2 h-2 rounded-full bg-bento-accent" /><span className="text-[8px] md:text-[10px] uppercase tracking-[0.25em] font-bold opacity-70">Posledný príspevok</span></div>
                <p className="text-lg md:text-2xl font-serif italic mt-2 md:mt-3 break-words line-clamp-1">
                  {photos.length > 0 ? (
                    (() => {
                      const latestPhoto = [...photos].sort((a, b) => 
                        new Date(b.createdTime || b.dateTaken || 0).getTime() - new Date(a.createdTime || a.dateTaken || 0).getTime()
                      )[0];
                      return latestPhoto.nickname || 'Hosť';
                    })()
                  ) : 'Zatiaľ prázdne...'}
                </p>
                <p className="text-[8px] md:text-[9px] uppercase tracking-[0.2em] opacity-50 mt-1 md:mt-2 font-bold font-mono">Práve zdieľané</p>
              </div>
              
              {photos.length > 0 && (
                (() => {
                  const latestPhoto = [...photos].sort((a, b) => 
                    new Date(b.createdTime || b.dateTaken || 0).getTime() - new Date(a.createdTime || a.dateTaken || 0).getTime()
                  )[0];
                  return latestPhoto.thumbnailLink ? (
                    <div className="relative z-10 ml-4 flex-shrink-0">
                      <div className="w-16 h-16 md:w-20 md:h-20 rounded-2xl md:rounded-3xl overflow-hidden border-2 border-white/10 group-hover:border-bento-accent/50 transition-colors shadow-lg">
                        <img 
                          loading="lazy"
                          src={latestPhoto.thumbnailLink.replace('s220', 's400')} 
                          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" 
                          referrerPolicy="no-referrer" 
                        />
                      </div>
                    </div>
                  ) : null;
                })()
              )}

              {/* Subtle radial glow on hover */}
              <div className="absolute inset-0 bg-radial-[circle_at_70%_50%] from-bento-accent/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
            </div>
          </div>

          <div className="bg-white rounded-[48px] p-6 md:p-10 shadow-sm border border-bento-border min-h-[600px]">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-10 px-2 gap-4">
              <div>
                <h3 className="text-3xl md:text-4xl font-serif italic text-bento-dark">Galéria spomienok</h3>
                <p className="text-[10px] text-bento-muted font-bold uppercase tracking-[0.3em] mt-3">Momenty zachytené vami</p>
              </div>
              <div className="flex items-center gap-2 md:gap-3">
                <div className="bg-bento-bg border border-bento-border rounded-full p-1 flex items-center shadow-sm">
                  <button 
                    onClick={() => setViewMode('grid')}
                    className={`p-1.5 rounded-full transition-all ${viewMode === 'grid' ? 'bg-bento-accent text-white shadow-sm' : 'text-bento-muted hover:text-bento-dark'}`}
                    title="Mriežka"
                  >
                    <LayoutGrid className="w-3.5 h-3.5 md:w-4 md:h-4" />
                  </button>
                  <button 
                    onClick={() => setViewMode('list')}
                    className={`p-1.5 rounded-full transition-all ${viewMode === 'list' ? 'bg-bento-accent text-white shadow-sm' : 'text-bento-muted hover:text-bento-dark'}`}
                    title="Zoznam"
                  >
                    <List className="w-3.5 h-3.5 md:w-4 md:h-4" />
                  </button>
                </div>

                <motion.button 
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setSortOrder(prev => prev === 'desc' ? 'asc' : 'desc')}
                  className="flex items-center gap-2 px-3 py-1.5 bg-bento-bg border border-bento-border rounded-full text-bento-muted hover:text-bento-dark transition-all shadow-sm cursor-pointer"
                  title={sortOrder === 'desc' ? 'Najnovšie prvé' : 'Najstaršie prvé'}
                >
                  {sortOrder === 'desc' ? <ArrowDownAZ className="w-4 h-4" /> : <ArrowUpZA className="w-4 h-4" />}
                  <span className="text-[10px] font-bold uppercase tracking-widest hidden md:inline">
                    {sortOrder === 'desc' ? 'Najnovšie' : 'Najstaršie'}
                  </span>
                </motion.button>
                {isLoadingPhotos && <Loader2 className="w-5 h-5 animate-spin text-bento-accent" />}
              </div>
            </div>

            {photos.length === 0 && !isLoadingPhotos ? (
              <div className="py-32 text-center rounded-[32px] border-3 border-dashed border-bento-border/50 bg-bento-bg/30">
                <ImageIcon className="w-16 h-16 text-bento-accent opacity-20 mx-auto mb-6" />
                <p className="font-serif italic text-xl text-bento-muted px-10">Zatiaľ sa tu nenachádzajú žiadne fotografie. Buďte prvý!</p>
              </div>
            ) : viewMode === 'grid' ? (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
                <AnimatePresence mode="popLayout">
                  {photos.map((photo, idx) => (
                    <motion.div 
                      key={photo.id} 
                      layout 
                      initial={{ opacity: 0, y: 20 }} 
                      animate={{ opacity: 1, y: 0 }} 
                      transition={{ delay: idx * 0.05 }} 
                      onClick={() => setSelectedPhotoIndex(idx)}
                      className="group relative aspect-[3/4] rounded-2xl overflow-hidden border border-bento-border shadow-sm hover:shadow-2xl transition-all cursor-pointer"
                    >
                      {photo.thumbnailLink ? (
                        <img 
                          src={photo.thumbnailLink.replace('s220', 's800')} 
                          alt="" 
                          loading="lazy"
                          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-1000 ease-out" 
                          referrerPolicy="no-referrer" 
                        />
                      ) : (
                        <div className="w-full h-full bg-bento-bg flex items-center justify-center">
                          <ImageIcon className="w-10 h-10 text-bento-muted opacity-20" />
                        </div>
                      )}
                      <div className="absolute inset-0 bg-gradient-to-t from-bento-dark/95 via-bento-dark/20 to-transparent opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-all p-4 md:p-6 flex flex-col justify-end">
                        <div className="absolute top-3 left-3 md:top-4 md:left-4 flex flex-col gap-1.5">
                          {(photo.likes && photo.likes.length > 0) || photo.commentCount ? (
                            <div className="flex flex-col gap-1.5">
                              {photo.likes && photo.likes.length > 0 && (
                                <div className="flex items-center gap-1.5 bg-black/40 backdrop-blur-md px-2 py-1 rounded-full text-white border border-white/10 w-fit">
                                  <Heart className="w-3 h-3 fill-bento-accent text-bento-accent" />
                                  <span className="text-[10px] md:text-xs font-bold font-mono">{photo.likes.length}</span>
                                </div>
                              )}
                              {photo.commentCount && photo.commentCount > 0 && (
                                <div className="flex items-center gap-1.5 bg-black/40 backdrop-blur-md px-2 py-1 rounded-full text-white border border-white/10 w-fit">
                                  <MessageCircle className="w-3 h-3 text-white/80" />
                                  <span className="text-[10px] md:text-xs font-bold font-mono">{photo.commentCount}</span>
                                </div>
                              )}
                            </div>
                          ) : null}
                        </div>

                        <div className="absolute top-3 right-3 md:top-4 md:right-4 flex flex-col gap-2">
                          <div className="bg-white/20 backdrop-blur-md p-2 rounded-full text-white opacity-0 group-hover:opacity-100 transition-opacity">
                            <Maximize2 className="w-4 h-4" />
                          </div>
                          {(isAdmin || (user && (user.uid === photo.uid || uploadedPhotoIds.includes(photo.id)))) && (
                            <motion.button
                              whileHover={{ scale: 1.1, color: '#ef4444' }}
                              whileTap={{ scale: 0.9 }}
                              onClick={(e) => { e.stopPropagation(); setPhotoToDelete(photo); }}
                              className="hidden md:block p-2 bg-red-500/80 backdrop-blur-md rounded-full text-white hover:bg-red-600 transition-colors shadow-lg"
                              title="Vymazať fotku"
                            >
                              <Trash2 className="w-4 h-4" />
                            </motion.button>
                          )}
                        </div>

                        <div className="flex justify-between items-end">
                          <div className="flex-1 min-w-0 pr-2">
                            <p className="text-white text-lg md:text-xl font-serif italic mb-0.5 md:mb-1 truncate">{photo.nickname}</p>
                            <p className="text-white/60 text-[8px] md:text-[10px] uppercase tracking-widest font-bold font-mono truncate">{formatDate(photo.dateTaken || photo.createdTime)}</p>
                          </div>
                          
                          <div className="hidden md:flex items-center">
                            {user && !user.isAnonymous && (
                              <motion.button
                                whileHover={{ scale: 1.1 }}
                                whileTap={{ scale: 0.9 }}
                                onClick={(e) => handleDownload(e, photo.webContentLink)}
                                className="p-2.5 bg-bento-accent/90 backdrop-blur-md rounded-full text-white hover:bg-white hover:text-bento-accent transition-all shadow-lg"
                                title="Stiahnuť originál"
                              >
                                <Download className="w-4 h-4 md:w-5 md:h-5" />
                              </motion.button>
                            )}
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
            ) : (
              <div className="flex flex-col gap-4 md:gap-6 max-w-4xl mx-auto w-full">
                <AnimatePresence mode="popLayout">
                  {photos.map((photo, idx) => (
                    <motion.div 
                      key={photo.id}
                      layout
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: idx * 0.05 }}
                      onClick={() => setSelectedPhotoIndex(idx)}
                      className="group bg-white rounded-2xl md:rounded-[32px] overflow-hidden border border-bento-border shadow-sm hover:shadow-xl transition-all cursor-pointer flex flex-col md:flex-row h-auto"
                    >
                      <div className="w-full md:w-[280px] aspect-video md:aspect-square flex-shrink-0 relative overflow-hidden">
                        {photo.thumbnailLink ? (
                          <img 
                            src={photo.thumbnailLink.replace('s220', 's800')} 
                            alt="" 
                            loading="lazy"
                            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-1000 ease-out" 
                            referrerPolicy="no-referrer" 
                          />
                        ) : (
                          <div className="w-full h-full bg-bento-bg flex items-center justify-center">
                            <ImageIcon className="w-12 h-12 text-bento-muted opacity-20" />
                          </div>
                        )}
                        <div className="absolute inset-0 bg-black/5 group-hover:bg-transparent transition-colors" />
                      </div>
                      <div className="flex-1 p-6 md:p-8 flex flex-col justify-between">
                         <div className="flex justify-between items-start">
                            <div className="space-y-1">
                               <p className="text-2xl md:text-3xl font-serif italic text-bento-dark">{photo.nickname}</p>
                               <p className="text-[10px] md:text-xs uppercase tracking-widest text-bento-muted font-bold font-mono">
                                 {formatDate(photo.dateTaken || photo.createdTime)}
                               </p>
                            </div>
                            <div className="flex items-center gap-2">
                               {user && !user.isAnonymous && (
                                 <motion.button
                                   whileHover={{ scale: 1.1 }}
                                   whileTap={{ scale: 0.9 }}
                                   onClick={(e) => handleDownload(e, photo.webContentLink)}
                                   className="p-2 text-bento-muted hover:text-bento-accent transition-colors"
                                   title="Stiahnuť originál"
                                 >
                                   <Download className="w-5 h-5" />
                                 </motion.button>
                               )}
                               {isAdmin || (user && (user.uid === photo.uid || uploadedPhotoIds.includes(photo.id))) && (
                                 <motion.button
                                   whileHover={{ scale: 1.1, color: '#ef4444' }}
                                   onClick={(e) => { e.stopPropagation(); setPhotoToDelete(photo); }}
                                   className="p-2 text-bento-muted hover:text-red-500 transition-colors"
                                   title="Vymazať fotku"
                                 >
                                   <Trash2 className="w-5 h-5" />
                                 </motion.button>
                               )}
                            </div>
                         </div>
                         <div className="mt-8 flex items-center gap-6">
                            <div className="flex items-center gap-2 bg-bento-bg px-3 py-1.5 rounded-full border border-bento-border/50">
                               <Heart className={`w-4 h-4 ${photo.likes?.length ? 'fill-bento-accent text-bento-accent' : 'text-bento-muted'}`} />
                               <span className="text-sm font-bold font-mono text-bento-dark">{photo.likes?.length || 0}</span>
                            </div>
                            <div className="flex items-center gap-2 bg-bento-bg px-3 py-1.5 rounded-full border border-bento-border/50">
                               <MessageCircle className="w-4 h-4 text-bento-muted" />
                               <span className="text-sm font-bold font-mono text-bento-dark">{photo.commentCount || 0}</span>
                            </div>
                            <div className="ml-auto opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-2 text-bento-accent font-bold uppercase tracking-widest text-[10px]">
                              <span>Zobraziť detail</span>
                              <ChevronRight className="w-3 h-3" />
                            </div>
                         </div>
                      </div>
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
            )}
          </div>
        </section>
      </main>
      <AnimatePresence>
        {selectedPhotoIndex !== null && photos[selectedPhotoIndex] && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[200] bg-bento-dark/95 backdrop-blur-xl flex items-center justify-center overflow-hidden"
            onClick={() => setSelectedPhotoIndex(null)}
          >
            <motion.button
              initial={{ opacity: 0, scale: 0.5 }}
              animate={{ opacity: 1, scale: 1 }}
              className="absolute top-6 right-6 z-50 p-3 bg-white/10 hover:bg-white/20 rounded-full text-white backdrop-blur-md transition-colors"
              onClick={() => setSelectedPhotoIndex(null)}
            >
              <X className="w-6 h-6" />
            </motion.button>

            <div className="absolute inset-y-0 left-0 hidden md:flex items-center px-4">
              <button 
                className="p-4 bg-white/5 hover:bg-white/10 rounded-full text-white backdrop-blur-sm transition-all"
                onClick={(e) => { e.stopPropagation(); navigatePhoto(-1); }}
              >
                <ChevronLeft className="w-8 h-8" />
              </button>
            </div>

            <div className="absolute inset-y-0 right-0 hidden md:flex items-center px-4">
              <button 
                className="p-4 bg-white/5 hover:bg-white/10 rounded-full text-white backdrop-blur-sm transition-all"
                onClick={(e) => { e.stopPropagation(); navigatePhoto(1); }}
              >
                <ChevronRight className="w-8 h-8" />
              </button>
            </div>

            <motion.div
              key={photos[selectedPhotoIndex].id}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="w-full h-full flex flex-col md:flex-row p-4 md:p-12 gap-6 md:gap-12 items-center justify-start md:justify-center relative overflow-y-auto no-scrollbar pt-20 md:pt-12"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Image Container */}
              <div className="flex-shrink-0 w-full md:flex-1 md:h-full min-h-[40vh] md:min-w-0 flex flex-col items-center justify-center">
                <div className="relative w-full h-full flex items-center justify-center group overflow-hidden">
                  <motion.div
                    initial={{ scale: 0.9, opacity: 0 }}
                    animate={{ 
                      scale: zoomScale, 
                      opacity: 1,
                      cursor: zoomScale > 1 ? 'grab' : 'default'
                    }}
                    drag={zoomScale > 1 ? true : 'x'}
                    dragConstraints={zoomScale > 1 ? undefined : { left: 0, right: 0 }}
                    dragElastic={zoomScale > 1 ? 0 : 0.4}
                    onDragEnd={(_, info) => {
                      if (zoomScale === 1) {
                        if (info.offset.x > 100) navigatePhoto(-1);
                        else if (info.offset.x < -100) navigatePhoto(1);
                      }
                    }}
                    className="relative w-full h-full flex items-center justify-center"
                  >
                    <img
                      src={photos[selectedPhotoIndex].thumbnailLink.replace('s220', 's1600')}
                      alt=""
                      className={`max-w-full max-h-[50vh] md:max-h-full object-contain pointer-events-none select-none rounded-[16px] md:rounded-[40px] shadow-2xl border border-white/10 transition-transform duration-300`}
                      referrerPolicy="no-referrer"
                    />
                  </motion.div>

                  {/* Zoom Controls Overlay */}
                  <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex items-center gap-2 md:gap-4 bg-white/10 backdrop-blur-md px-4 py-2 rounded-full border border-white/10 z-[60] opacity-0 group-hover:opacity-100 transition-opacity">
                    <button 
                      onClick={(e) => { e.stopPropagation(); setZoomScale(prev => Math.max(1, prev - 0.5)); }}
                      disabled={zoomScale <= 1}
                      className="p-2 text-white/70 hover:text-white disabled:opacity-30 transition-colors"
                      title="Zmenšiť"
                    >
                      <ZoomOut className="w-5 h-5" />
                    </button>
                    <span className="text-white font-mono text-xs w-12 text-center">{Math.round(zoomScale * 100)}%</span>
                    <button 
                      onClick={(e) => { e.stopPropagation(); setZoomScale(prev => Math.min(4, prev + 0.5)); }}
                      disabled={zoomScale >= 4}
                      className="p-2 text-white/70 hover:text-white disabled:opacity-30 transition-colors"
                      title="Zväčšiť"
                    >
                      <ZoomIn className="w-5 h-5" />
                    </button>
                    <button 
                      onClick={(e) => { e.stopPropagation(); setZoomScale(1); }}
                      className="p-2 text-white/40 hover:text-white transition-colors border-l border-white/10 ml-2"
                      title="Resetovať"
                    >
                      <RefreshCw className="w-4 h-4" />
                    </button>
                  </div>
                </div>
                
                <div className="mt-4 md:mt-6 text-center space-y-1 md:space-y-2 px-4">
                  <motion.p initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="text-white text-2xl md:text-5xl font-serif italic line-clamp-2">
                    {photos[selectedPhotoIndex].nickname || 'Hosť'}
                  </motion.p>
                  <motion.p initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="text-white/50 text-[8px] md:text-xs uppercase tracking-[0.15em] md:tracking-[0.3em] font-bold">
                    {formatDate(photos[selectedPhotoIndex].dateTaken || photos[selectedPhotoIndex].createdTime)}
                  </motion.p>
                </div>
              </div>

              {/* Interaction Sidebar */}
              <motion.div 
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                className="w-full md:w-[380px] min-h-[400px] md:h-[80vh] bg-white/5 backdrop-blur-xl rounded-[24px] md:rounded-[40px] flex flex-col border border-white/10 overflow-hidden mb-20 md:mb-0"
              >
                {/* Likes Header */}
                <div className="p-6 border-b border-white/10 flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2 md:gap-3">
                    <motion.button
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                      onClick={() => toggleLike(photos[selectedPhotoIndex!])}
                      className={`p-2.5 md:p-3 rounded-full transition-all ${photos[selectedPhotoIndex!].likes?.includes(user?.uid || guestUid) ? 'bg-red-500 text-white shadow-lg shadow-red-500/30' : 'bg-white/10 text-white/70 hover:bg-white/20'}`}
                    >
                      <Heart className={`w-4 h-4 md:w-5 md:h-5 ${photos[selectedPhotoIndex!].likes?.includes(user?.uid || guestUid) ? 'fill-current' : ''}`} />
                    </motion.button>
                    <span className="text-[10px] md:text-sm font-bold uppercase tracking-widest text-white/90">
                      {photos[selectedPhotoIndex!].likes?.length || 0} Pozdravov
                    </span>
                  </div>
                    <div className="flex items-center gap-4">
                      {user && !user.isAnonymous && (
                        <motion.button
                          whileHover={{ scale: 1.1 }}
                          onClick={(e) => handleDownload(e, photos[selectedPhotoIndex!].webContentLink)}
                          className="text-white/60 hover:text-white transition-colors"
                          title="Stiahnuť"
                        >
                          <Download className="w-5 h-5" />
                        </motion.button>
                      )}
                      {(isAdmin || (user && (user.uid === photos[selectedPhotoIndex!].uid || uploadedPhotoIds.includes(photos[selectedPhotoIndex!].id)))) && (
                        <motion.button
                          whileHover={{ scale: 1.1, color: '#ef4444' }}
                          whileTap={{ scale: 0.9 }}
                          onClick={(e) => { e.stopPropagation(); setPhotoToDelete(photos[selectedPhotoIndex!]); }}
                          className="text-white/60 hover:text-red-500 transition-colors"
                          title="Vymazať"
                        >
                          <Trash2 className="w-5 h-5" />
                        </motion.button>
                      )}
                      <div className="flex items-center gap-2 text-white/40">
                        <MessageCircle className="w-4 h-4" />
                        <span className="text-xs font-bold uppercase tracking-widest">{comments.length}</span>
                      </div>
                    </div>
                </div>

                {/* Comments List */}
                <div className="flex-1 overflow-y-auto p-6 space-y-6 no-scrollbar">
                  {comments.length === 0 ? (
                    <div className="h-full flex flex-col items-center justify-center text-center opacity-30 space-y-4">
                      <MessageCircle className="w-10 h-10" />
                      <p className="text-[10px] uppercase tracking-[0.2em] font-bold">Zatiaľ žiadne komentáre</p>
                    </div>
                  ) : (
                    comments.map((comment) => (
                      <div key={comment.id} className="space-y-1.5 group">
                        <div className="flex items-baseline justify-between gap-2">
                          <span className="text-[10px] uppercase tracking-widest font-extrabold text-bento-accent">{comment.nickname}</span>
                          <span className="text-[8px] font-mono opacity-30 uppercase">{comment.createdAt ? formatDate(comment.createdAt.toDate().toISOString()) : 'Teraz'}</span>
                        </div>
                        <p className="text-sm text-white/90 font-serif italic leading-relaxed">{comment.text}</p>
                      </div>
                    ))
                  )}
                </div>

                {/* Comment Input */}
                <div className="p-6 bg-white/5 border-t border-white/10">
                  <div className="relative">
                    <input 
                      type="text"
                      placeholder="Napíš odkaz..."
                      value={newComment}
                      onChange={(e) => setNewComment(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && postComment()}
                      className="w-full bg-white/10 rounded-2xl py-3 pl-5 pr-12 text-sm placeholder:text-white/20 focus:outline-none focus:ring-2 focus:ring-bento-accent/50 transition-all text-white font-serif italic"
                    />
                    <button 
                      onClick={postComment}
                      disabled={!newComment.trim()}
                      className={`absolute right-2 top-1/2 -translate-y-1/2 p-2 rounded-xl transition-all ${newComment.trim() ? 'bg-bento-accent text-white shadow-lg' : 'text-white/20'}`}
                    >
                      <Send className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </motion.div>
            </motion.div>

            <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex gap-1.5 overflow-x-auto max-w-[80vw] pb-4 px-4 no-scrollbar">
              {photos.map((_, i) => (
                <button
                  key={i}
                  className={`flex-shrink-0 w-2 h-2 rounded-full transition-all ${i === selectedPhotoIndex ? 'bg-bento-accent w-6' : 'bg-white/20'}`}
                  onClick={(e) => { e.stopPropagation(); setSelectedPhotoIndex(i); }}
                />
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      <style>{`
        @keyframes progress-shrink {
          from { width: 100%; }
          to { width: 0%; }
        }
        .animate-progress-shrink {
          animation: progress-shrink 2.5s linear forwards;
        }
        .no-scrollbar::-webkit-scrollbar { display: none; }
        .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
        body { background-color: #F2F1EC; }
        @theme {
          --color-bento-bg: #F2F1EC;
          --color-bento-text: #3D3B35;
          --color-bento-muted: #8E8A7E;
          --color-bento-accent: #D4AF37;
          --color-bento-dark: #2A2821;
          --color-bento-border: #E5E1D5;
          --font-serif: 'Cormorant Garamond', serif;
          --font-sans: 'Inter', sans-serif;
        }
      `}</style>
    </div>
  );
}
