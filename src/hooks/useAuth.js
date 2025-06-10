import { useState, useEffect } from 'react';
import axios from 'axios';

const BACKEND_URL = 'https://trip-app-final-v2-493005991008.asia-northeast1.run.app';

export const useAuth = (setCurrentScreenExt) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [userProfile, setUserProfile] = useState({ nickname: '', bio: '', avatarUrl: '', favoritePlaces: [] });

  const fetchUserProfile = async (userId, token) => {
    console.log('[useAuth] fetchUserProfile called with userId:', userId, 'token exists:', !!token); // ★ログ追加
    if (!token) {
      console.log('[useAuth] fetchUserProfile: No token, returning.');
      return;
    }
    try {
      const response = await axios.get(`${BACKEND_URL}/api/users/profile`, { headers: { Authorization: `Bearer ${token}` } });
      console.log('[useAuth] fetchUserProfile raw response.data:', response.data); 
      let profileData = response.data || { nickname: '', bio: '', avatarUrl: '', favoritePlaces: [] };
      if (profileData.avatar_url && profileData.avatarUrl === undefined) {
        profileData.avatarUrl = profileData.avatar_url;
      }
      console.log('[useAuth] fetchUserProfile processed profileData for setUserProfile:', profileData);
      setUserProfile(profileData);
    } catch (error) {
      console.error('Failed to fetch user profile:', error.response?.data || error.message);
    }
  };

  useEffect(() => {
    const storedToken = localStorage.getItem('token');
    const storedUser = localStorage.getItem('user');
    if (storedToken && storedUser) {
      const parsedUser = JSON.parse(storedUser);
      setCurrentUser({ ...parsedUser, token: storedToken });
    } else {
      setCurrentUser(null); 
    }
  }, []); 

  useEffect(() => {
    console.log('[useAuth] useEffect [currentUser] triggered. currentUser:', currentUser); // ★ログ追加
    if (currentUser && currentUser.token) {
      console.log('[useAuth] useEffect [currentUser]: currentUser and token exist, calling fetchUserProfile.');
      fetchUserProfile(currentUser.id, currentUser.token);
    } else {
      console.log('[useAuth] useEffect [currentUser]: currentUser or token missing, resetting profile.');
      setUserProfile({ nickname: '', bio: '', avatarUrl: '', favoritePlaces: [] });
    }
  }, [currentUser]); 

  const handleSignup = async (signupData) => { /* ... (実装済み) ... */ };
  const handleLogin = async (loginData) => { /* ... (実装済み) ... */ };
  const handleLogout = () => { /* ... (実装済み) ... */ };
  const handleSendPasswordResetLink = async (email) => { /* ... (実装済み) ... */ };
  const handleConfirmCodeAndSetNewPassword = async (code, newPassword) => { /* ... (実装済み) ... */};
  const handleShowProfileEdit = () => { /* ... (実装済み) ... */ };
  const handleSaveProfile = async (profileDataFromForm, avatarFile = null) => { /* ... (実装済み) ... */ };
  const handleShowAccountSettings = () => { /* ... (実装済み) ... */ };
  const handleChangePasswordRequest = () => { /* ... (実装済み) ... */ };
  const handleConfirmPasswordChange = async (oldPassword, newPassword) => { /* ... (実装済み) ... */ };
  const handleChangeEmailRequest = () => { /* ... (実装済み) ... */ };
  const handleSendEmailConfirmation = async (newEmail) => { /* ... (実装済み) ... */ };
  const handleDeleteAccountRequest = () => { /* ... (実装済み) ... */ };
  const handleConfirmAccountDeletion = async () => { /* ... (実装済み) ... */ };

  return { /* ... (以前と同様のエクスポート) ... */ };
};
