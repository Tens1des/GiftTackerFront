import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { ToastProvider } from './contexts/ToastContext';
import { Home } from './pages/Home';
import { Login } from './pages/Login';
import { Register } from './pages/Register';
import { CreateWishlist } from './pages/CreateWishlist';
import { MyWishlists } from './pages/MyWishlists';
import { WishlistView } from './pages/WishlistView';
import './App.css';

function App() {
  return (
    <AuthProvider>
      <ToastProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/new" element={<CreateWishlist />} />
            <Route path="/my" element={<MyWishlists />} />
            <Route path="/w/:slug" element={<WishlistView />} />
            <Route path="/w/:slug/edit" element={<WishlistView />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </BrowserRouter>
      </ToastProvider>
    </AuthProvider>
  );
}

export default App;
