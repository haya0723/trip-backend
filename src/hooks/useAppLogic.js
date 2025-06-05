import React, { useState, useEffect } from 'react';
import axios from 'axios'; // axios をインポート

// バックエンドAPIのベースURL
const BACKEND_URL = 'https://trip-app-final-v2-493005991008.asia-northeast1.run.app'; // ユーザー確認済みの正しいURL

// ダミーデータ (初期表示用、API連携後は削除または置き換え)
const dummyDailySchedulesForTrip1 = [
  { date: '2024-08-10', dayDescription: '移動と札幌市内観光', hotel: { name: '札幌グランドホテル', address: '札幌市中央区北1条西4丁目', checkIn: '15:00', checkOut: '11:00', notes: '予約番号: XYZ123' }, events: [ { id: 'evt1-1', time: '14:00', type: 'travel', name: '新千歳空港から札幌市内へ移動', description: 'JR快速エアポート', estimatedDurationMinutes: 40, category: '移動', memory: null }, { id: 'evt1-2', time: '15:00', type: 'hotel_checkin', name: '札幌グランドホテル', description: 'チェックイン', estimatedDurationMinutes: 60, category: '宿泊', details: { address: '札幌市中央区北1条西4丁目', isHotel: true }, memory: null }, { id: 'evt1-3', time: '16:30', type: 'activity', name: '大通公園散策', description: 'テレビ塔や花時計を見る', estimatedDurationMinutes: 90, category: '観光', details: { address: '札幌市中央区大通西1～12丁目' }, memory: { notes: "楽しかった！", rating: 4, photos: ["https://via.placeholder.com/150/FF0000/FFFFFF?Text=DummyMem1"], videos: ["dummy_video.mp4"] } } , { id: 'evt1-4', time: '18:30', type: 'meal', name: '夕食：ジンギスカン', description: 'だるま 本店', estimatedDurationMinutes: 90, category: '食事', details: { address: '札幌市中央区南5条西4' }, memory: null }, ] },
  { date: '2024-08-11', dayDescription: '小樽観光', hotel: { name: '札幌グランドホテル', address: '札幌市中央区北1条西4丁目', checkIn: '15:00', checkOut: '11:00', notes: '連泊' }, events: [ { id: 'evt1-5', time: '09:00', type: 'travel', name: '札幌から小樽へ移動', description: 'JR函館本線', estimatedDurationMinutes: 50, category: '移動', memory: null }, { id: 'evt1-6', time: '10:00', type: 'activity', name: '小樽運河クルーズ', description: '歴史的な運河を巡る', estimatedDurationMinutes: 40, category: '観光', details: { address: '小樽市港町５' }, memory: null }, ] },
  { date: '2024-08-12', dayDescription: '富良野日帰り', hotel: null, events: []}
];
const initialDummyTrips = [
  { id: 1, name: '夏の北海道旅行2024', period: '2024/08/10 - 2024/08/15 (5泊6日)', destinations: '札幌、小樽、富良野', status: '計画中', coverImage: 'https://images.unsplash.com/photo-1506748686214-e9df14d4d9d0?q=80&w=1000&auto=format&fit=crop', schedules: dummyDailySchedulesForTrip1, overallMemory: { notes: "全体的に素晴らしい旅行だった。", rating: 5, photos: [], videos: [] }, isPublic: false },
  { id: 2, name: '京都紅葉狩り', period: '2023/11/20 - 2023/11/23 (3泊4日)', destinations: '京都', status: '完了', coverImage: 'https://images.unsplash.com/photo-1534564737930-39a482142209?q=80&w=1000&auto=format&fit=crop', schedules: [], overallMemory: null, isPublic: true, publicDescription: "紅葉シーズンの京都は最高でした！特に清水寺のライトアップは必見です。", publicTags: ["紅葉", "京都", "寺社仏閣"], overallAuthorComment: "清水寺のライトアップは本当に幻想的でした。人も多かったですが、それだけの価値はあります。食事は先斗町で京料理をいただきましたが、こちらもおすすめです。" },
  { id: 3, name: '沖縄リゾート満喫', period: '2024/07/01 - 2024/07/05 (4泊5日)', destinations: '那覇、恩納村', status: '予約済み', coverImage: null, schedules: [], overallMemory: null, isPublic: false },
];
export const initialDummyPublicTrips = [ /* ... (内容は省略、以前のコードからコピー) ... */ ];


export const useAppLogic = () => {
  const [currentScreen, setCurrentScreen] = useState('login');
  const [editingPlan, setEditingPlan] = useState(null);
  const [selectedTrip, setSelectedTrip] = useState(null);
  const [selectedPlaceDetail, setSelectedPlaceDetail] = useState(null);
  const [currentRouteQuery, setCurrentRouteQuery] = useState(null);
  const [editingMemoryForEvent, setEditingMemoryForEvent] = useState(null);
  const [viewingMemoriesForTripId, setViewingMemoriesForTripId] = useState(null);
  const [selectedPublicTripDetail, setSelectedPublicTripDetail] = useState(null);
  const [currentHotelForRecommendations, setCurrentHotelForRecommendations] = useState(null);
  const [userProfile, setUserProfile] = useState({
    nickname: '', bio: '', avatarUrl: '', favoritePlaces: []
  });
  const [currentUser, setCurrentUser] = useState(null);
  const [trips, setTrips] = useState(initialDummyTrips);
  const [editingEventDetails, setEditingEventDetails] = useState(null);
  const [placeSearchContext, setPlaceSearchContext] = useState(null);
  const [aiRecommendedCourses, setAiRecommendedCourses] = useState([]);
  const [favoritePickerContext, setFavoritePickerContext] = useState(null);
  const [editingPublishSettingsForTripId, setEditingPublishSettingsForTripId] = useState(null);
  const [editingHotelDetails, setEditingHotelDetails] = useState(null);

  const fetchUserProfile = async (userId, token) => {
    console.log(`[useAppLogic] fetchUserProfile called for userId: ${userId}`);
    try {
      const response = await axios.get(`${BACKEND_URL}/api/users/profile`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      console.log('[useAppLogic] fetchUserProfile - API response.data:', response.data);
      setUserProfile(response.data);
      console.log('[useAppLogic] fetchUserProfile - userProfile state should be updated.');
    } catch (error) {
      console.error('Failed to fetch user profile:', error.response ? error.response.data : error.message);
    }
  };

  useEffect(() => {
    console.log('[useAppLogic] Initial useEffect triggered.');
    const storedToken = localStorage.getItem('authToken');
    const storedUser = localStorage.getItem('authUser');
    console.log('[useAppLogic] Initial useEffect - storedToken:', storedToken ? 'present' : 'absent', 'storedUser:', storedUser ? 'present' : 'absent');
    if (storedToken && storedUser) {
      try {
        const userData = JSON.parse(storedUser);
        console.log('[useAppLogic] Initial useEffect - parsed userData:', userData);
        setCurrentUser({ ...userData, token: storedToken });
        console.log('[useAppLogic] Initial useEffect - currentUser state set, about to call fetchUserProfile.');
        fetchUserProfile(userData.id, storedToken); 
        setCurrentScreen('tripList');
      } catch (e) {
        console.error('[useAppLogic] Initial useEffect - Error parsing storedUser from localStorage:', e);
        // Clear invalid stored data
        localStorage.removeItem('authToken');
        localStorage.removeItem('authUser');
        setCurrentScreen('login');
      }
    } else {
      setCurrentScreen('login'); // Ensure login screen if no token/user
    }
  }, []);

  useEffect(() => {
    console.log('[useAppLogic] currentUser/currentScreen effect triggered. currentUser:', currentUser ? 'present' : 'absent', 'currentScreen:', currentScreen);
    const authScreens = ['login', 'signup', 'passwordReset', 'accountDeletionConfirm'];
    if (!currentUser && !authScreens.includes(currentScreen)) { 
      console.log('[useAppLogic] No currentUser and not on auth screen, redirecting to login.');
      setCurrentScreen('login'); 
    }
    else if (currentUser && authScreens.includes(currentScreen) && currentScreen !== 'accountDeletionConfirm') { 
      console.log('[useAppLogic] currentUser exists and on auth screen (not deletion), redirecting to tripList.');
      setCurrentScreen('tripList'); 
    }
  }, [currentUser, currentScreen]);

  const handleSignup = async (signupData) => {
    console.log(`Attempting signup to: ${BACKEND_URL}/api/auth/signup with data:`, signupData);
    try {
      const { nickname, email, password } = signupData; 
      await axios.post(`${BACKEND_URL}/api/auth/signup`, { nickname, email, password }); 
      alert('ユーザー登録が完了しました。ログインしてください。');
      setCurrentScreen('login');
    } catch (error) {
      console.error('Signup failed:', error.response ? error.response.data : error.message);
      alert(`登録に失敗しました: ${error.response?.data?.error || error.message}`);
    }
  };

  const handleLogin = async (loginData) => {
    console.log(`Attempting login to: ${BACKEND_URL}/api/auth/login with data:`, loginData);
    try {
      const response = await axios.post(`${BACKEND_URL}/api/auth/login`, { 
        email: loginData.email, 
        password: loginData.password 
      });
      console.log('[useAppLogic] handleLogin - Login API response received. response.data:', response.data); 
      
      if (response.data && response.data.token && response.data.user) {
        const { token, user } = response.data;
        console.log('[useAppLogic] handleLogin - Token and user object found in response. User:', user, 'Token present:', !!token);
        setCurrentUser({ id: user.id, nickname: user.nickname, email: user.email, token });
        console.log('[useAppLogic] handleLogin - currentUser state updated.');
        
        console.log('[useAppLogic] handleLogin - Before calling fetchUserProfile. User ID:', user.id, 'Token present:', !!token);
        await fetchUserProfile(user.id, token); 
        console.log('[useAppLogic] handleLogin - After calling fetchUserProfile.');
        
        console.log('[useAppLogic] handleLogin - Attempting to set items in localStorage. Token:', token, 'User to store:', {id: user.id, nickname: user.nickname, email: user.email });
        localStorage.setItem('authToken', token);
        console.log('[useAppLogic] handleLogin - authToken set in localStorage.');
        localStorage.setItem('authUser', JSON.stringify({id: user.id, nickname: user.nickname, email: user.email }));
        console.log('[useAppLogic] handleLogin - authUser set in localStorage. Value:', localStorage.getItem('authUser'));
        setCurrentScreen('tripList');
      } else {
        console.error('[useAppLogic] handleLogin - Invalid response structure from login API:', response.data);
        alert('ログインレスポンスの形式が不正です。');
      }
    } catch (error) {
      console.error('Login failed:', error.response ? error.response.data : error.message);
      alert(`ログインに失敗しました: ${error.response?.data?.error || error.message}`);
    }
  };

  const handleLogout = () => {
    if (window.confirm('本当にログアウトしますか？')) {
      console.log('[useAppLogic] handleLogout - Logging out.');
      setCurrentUser(null);
      setUserProfile({ nickname: '', bio: '', avatarUrl: '', favoritePlaces: [] });
      localStorage.removeItem('authToken');
      localStorage.removeItem('authUser');
      console.log('[useAppLogic] handleLogout - Cleared currentUser, userProfile, and localStorage items.');
      setCurrentScreen('login');
    }
  };

  const handleShowProfileEdit = () => setCurrentScreen('profileEdit');

  const handleSaveProfile = async (profileDataToUpdate, avatarFile = null) => {
    console.log('[useAppLogic] handleSaveProfile called. profileDataToUpdate:', profileDataToUpdate, 'avatarFile:', avatarFile);
    if (!currentUser || !currentUser.token) {
      alert('ログインしていません。ログインしてください。');
      setCurrentScreen('login');
      return;
    }

    let finalAvatarUrl = profileDataToUpdate.avatarUrl; 
    if (avatarFile === null && profileDataToUpdate.avatarUrl === undefined) {
        finalAvatarUrl = userProfile.avatarUrl; 
    }

    try {
      if (avatarFile) {
        console.log('Attempting to upload avatar file:', avatarFile.name);
        const formData = new FormData();
        formData.append('avatar', avatarFile);

        const uploadResponse = await axios.post(
          `${BACKEND_URL}/api/upload/avatar`,
          formData,
          {
            headers: {
              'Content-Type': 'multipart/form-data',
              Authorization: `Bearer ${currentUser.token}`,
            },
          }
        );
        finalAvatarUrl = uploadResponse.data.avatarUrl;
        console.log('Avatar uploaded, URL:', finalAvatarUrl);
      }

      const payload = {
        nickname: profileDataToUpdate.nickname,
        bio: profileDataToUpdate.bio,
        avatarUrl: finalAvatarUrl, 
      };
      
      Object.keys(payload).forEach(key => payload[key] === undefined && delete payload[key]);

      console.log('Attempting to save profile with data:', payload);
      const response = await axios.put(
        `${BACKEND_URL}/api/users/profile`,
        payload,
        {
          headers: {
            Authorization: `Bearer ${currentUser.token}`,
          },
        }
      );

      const updatedProfileFromServer = response.data;
      console.log('[useAppLogic] handleSaveProfile - Profile update API success. Response data:', updatedProfileFromServer);
      setUserProfile(updatedProfileFromServer); 
      console.log('[useAppLogic] handleSaveProfile - userProfile state updated with server response.');
      setCurrentUser(prev => ({ ...prev, 
        nickname: updatedProfileFromServer.nickname, 
      }));
      console.log('[useAppLogic] handleSaveProfile - currentUser nickname updated.');
      const storedUser = JSON.parse(localStorage.getItem('authUser'));
      if (storedUser) {
        const newStoredUser = { ...storedUser, nickname: updatedProfileFromServer.nickname };
        localStorage.setItem('authUser', JSON.stringify(newStoredUser));
        console.log('[useAppLogic] handleSaveProfile - authUser in localStorage updated. New value:', newStoredUser);
      }

      alert('プロフィールを更新しました。');
      setCurrentScreen('myProfile');
    } catch (error) {
      console.error('Failed to save profile:', error.response ? error.response.data : error.message);
      alert(`プロフィールの更新に失敗しました: ${error.response?.data?.error || error.message}`);
    }
  };
  
  // 他のハンドラ関数 (内容は以前のコードからコピー)
  const handleShowPlanForm = (planToEdit = null) => { setCurrentScreen('planForm'); setEditingPlan(planToEdit); setSelectedTrip(null); };
  const handleShowTripDetail = (trip) => { setSelectedTrip(trip); setCurrentScreen('tripDetail'); };
  const handleSavePlan = (planData) => { /* ... */ };
  const handleCancelPlanForm = () => { setCurrentScreen('tripList'); setEditingPlan(null); };
  const handleBackToList = () => { setCurrentScreen('tripList'); setSelectedTrip(null); setEditingPlan(null); setCurrentHotelForRecommendations(null); setAiRecommendedCourses([]); };
  const handleRequestAIForTrip = (trip) => console.log('AIに旅程提案を依頼 (対象:', trip.name, ')');
  const handleShowPlaceSearchGeneral = () => { setPlaceSearchContext({ returnScreen: currentScreen, from: 'general' }); setCurrentScreen('placeSearch'); };
  const handleShowPlaceSearchForPlanForm = (callback) => { setPlaceSearchContext({ returnScreen: 'planForm', callback, from: 'planFormDestination' }); setCurrentScreen('placeSearch'); };
  const handleShowPlaceSearchForEvent = (callbackForPlace) => { setPlaceSearchContext({ returnScreen: 'eventForm', callback: callbackForPlace, from: 'eventForm' }); setCurrentScreen('placeSearch'); };
  const handleSetHotelForDay = (tripId, date) => { setPlaceSearchContext({ returnScreen: 'tripDetail', tripId, date, callback: handleHotelSelectedForDay, from: 'setHotelForDay' }); setCurrentScreen('placeSearch'); };
  const handleHotelSelectedForDay = (tripId, date, hotelInfo) => { /* ... */ };
  const newHandlePlaceSelected = (place) => { /* ... */ };
  const handleShowPlaceDetail = (place) => { setSelectedPlaceDetail(place); setCurrentScreen('placeDetail'); };
  const handleBackFromPlaceDetail = () => { /* ... */ };
  const handleShowRouteOptions = (origin, destination) => { setCurrentRouteQuery({ origin, destination }); setCurrentScreen('routeOptions'); };
  const handleRouteSelected = (route) => { console.log('選択された移動手段:', route); setCurrentScreen('tripDetail'); setCurrentRouteQuery(null); };
  const handleShowMemoryForm = (tripId, eventName, dateForEvent) => { /* ... */ };
  const handleSaveMemory = (memoryData) => { /* ... */ };
  const handleShowMemoryView = (tripId) => { setViewingMemoriesForTripId(tripId); setCurrentScreen('memoryView'); };
  const handleShowPublicTripsSearch = () => setCurrentScreen('publicTripsSearch');
  const handleSelectPublicTrip = (publicTrip) => { setSelectedPublicTripDetail(publicTrip); setCurrentScreen('publicTripDetail'); };
  const handleCopyToMyPlans = (publicTripData) => { /* ... */ };
  const handleCopyMyOwnTrip = (tripToCopy) => { /* ... */ };
  const handleAddFavoritePlace = (placeData) => { /* ... */ };
  const handleRemoveFavoritePlace = (placeIdOrName) => { /* ... */ };
  const handleShowHotelRecommendations = (hotel) => { setCurrentHotelForRecommendations(hotel); setAiRecommendedCourses([]); setCurrentScreen('hotelRecommendations'); };
  const handleShowAccountSettings = () => setCurrentScreen('accountSettings');
  const handleChangeTripStatus = (tripId, newStatus) => { /* ... */ };
  const handleToggleTripPublicStatus = (tripId) => { /* ... */ };
  const handleShowEventForm = (tripId, date, existingEvent = null) => { setEditingEventDetails({ tripId, date, existingEvent }); setCurrentScreen('eventForm'); };
  const handleSaveEvent = (date, eventData, existingEventToUpdate) => { /* ... */ };
  const handleDeleteAccountRequest = () => setCurrentScreen('accountDeletionConfirm');
  const handleConfirmAccountDeletion = (password) => { console.log('アカウント削除実行'); handleLogout(); };
  const handleChangePasswordRequest = () => { setCurrentScreen('passwordChange'); };
  const handleConfirmPasswordChange = (currentPassword, newPassword) => { console.log('パスワード変更実行'); setCurrentScreen('accountSettings'); };
  const handleChangeEmailRequest = () => { setCurrentScreen('emailChange'); };
  const handleSendEmailConfirmation = (currentPassword, newEmail) => { alert(`新しいメールアドレス ${newEmail} に確認メールを送信しました。（ダミー処理）`); setCurrentScreen('accountSettings'); };
  const handleSendPasswordResetLink = (email) => { console.log('パスワードリセットメール送信要求:', email); };
  const handleConfirmCodeAndSetNewPassword = (email, code, newPassword) => { console.log('確認コードと新パスワードでパスワード更新:', { email, code, newPassword }); };
  const handleShowMyProfile = () => { setCurrentScreen('myProfile'); };
  const handleShowFavoritePlaces = () => { setCurrentScreen('favoritePlacesList'); };
  const handleShowFavoritePickerForEvent = (callback) => { setFavoritePickerContext({ returnScreen: 'eventForm', callback }); setCurrentScreen('favoritePicker'); };
  const handleRequestAICourse = (hotel, params) => { /* ... */ };
  const handleShowPublishSettings = (tripId) => { setEditingPublishSettingsForTripId(tripId); setCurrentScreen('tripPublishSettings'); };
  const handleSavePublishSettings = (tripId, settings) => { /* ... */ };
  const handleCancelPublishSettings = () => { setEditingPublishSettingsForTripId(null); setCurrentScreen('tripDetail'); };
  const handleShowHotelDetailModal = (tripId, date, hotelData) => { setEditingHotelDetails({ tripId, date, hotelData }); };
  const handleSaveHotelDetails = (tripId, date, newHotelData) => { /* ... */ };
  const handleCancelHotelDetailModal = () => { setEditingHotelDetails(null); };

  return {
    currentScreen, setCurrentScreen,
    editingPlan, setEditingPlan,
    selectedTrip, setSelectedTrip,
    selectedPlaceDetail, setSelectedPlaceDetail,
    currentRouteQuery, setCurrentRouteQuery,
    editingMemoryForEvent, setEditingMemoryForEvent,
    viewingMemoriesForTripId, setViewingMemoriesForTripId,
    selectedPublicTripDetail, setSelectedPublicTripDetail,
    currentHotelForRecommendations, setCurrentHotelForRecommendations,
    userProfile, setUserProfile,
    currentUser, setCurrentUser,
    trips, setTrips,
    editingEventDetails, setEditingEventDetails,
    placeSearchContext, setPlaceSearchContext,
    aiRecommendedCourses, setAiRecommendedCourses,
    favoritePickerContext, setFavoritePickerContext,
    editingPublishSettingsForTripId,
    editingHotelDetails,
    handleShowPlanForm, handleShowTripDetail, handleSavePlan, handleCancelPlanForm, handleBackToList,
    handleRequestAIForTrip, handleShowPlaceSearchGeneral, handleShowPlaceSearchForPlanForm,
    handleShowPlaceSearchForEvent, handleSetHotelForDay, newHandlePlaceSelected,
    handleShowPlaceDetail, handleBackFromPlaceDetail, handleShowRouteOptions, handleRouteSelected,
    handleShowMemoryForm, handleSaveMemory, handleShowMemoryView, handleShowPublicTripsSearch,
    handleSelectPublicTrip, handleCopyToMyPlans, handleCopyMyOwnTrip, handleAddFavoritePlace,
    handleRemoveFavoritePlace, handleShowHotelRecommendations, handleShowProfileEdit, handleSaveProfile,
    handleShowAccountSettings, handleLogin, handleSignup, handleLogout, handleChangeTripStatus,
    handleToggleTripPublicStatus, handleShowEventForm, handleSaveEvent, handleDeleteAccountRequest,
    handleConfirmAccountDeletion, handleChangePasswordRequest, handleConfirmPasswordChange,
    handleChangeEmailRequest, handleSendEmailConfirmation, handleSendPasswordResetLink,
    handleConfirmCodeAndSetNewPassword, handleShowMyProfile, handleShowFavoritePlaces,
    handleShowFavoritePickerForEvent, handleRequestAICourse,
    handleShowPublishSettings, handleSavePublishSettings, handleCancelPublishSettings,
    handleShowHotelDetailModal, handleSaveHotelDetails, handleCancelHotelDetailModal,
    handleShowBackendTest: () => setCurrentScreen('backendTest')
  };
};
