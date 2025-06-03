import React, { useState, useEffect } from 'react';
import axios from 'axios'; // axios をインポート

// バックエンドAPIのベースURL (実際のCloud RunサービスのURLに置き換える)
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
export const initialDummyPublicTrips = [ /* ... (内容は省略) ... */ ];


export const useAppLogic = () => {
  const [currentScreen, setCurrentScreen] = useState('login'); // 初期画面をログインに
  const [editingPlan, setEditingPlan] = useState(null);
  const [selectedTrip, setSelectedTrip] = useState(null);
  const [selectedPlaceDetail, setSelectedPlaceDetail] = useState(null);
  const [currentRouteQuery, setCurrentRouteQuery] = useState(null);
  const [editingMemoryForEvent, setEditingMemoryForEvent] = useState(null);
  const [viewingMemoriesForTripId, setViewingMemoriesForTripId] = useState(null);
  const [selectedPublicTripDetail, setSelectedPublicTripDetail] = useState(null);
  const [currentHotelForRecommendations, setCurrentHotelForRecommendations] = useState(null);
  const [userProfile, setUserProfile] = useState({
    nickname: '',
    bio: '',
    avatarUrl: '',
    favoritePlaces: []
  });
  const [currentUser, setCurrentUser] = useState(null); // { id, nickname, email, token }
  const [trips, setTrips] = useState(initialDummyTrips); // API連携後は空配列で初期化
  const [editingEventDetails, setEditingEventDetails] = useState(null);
  const [placeSearchContext, setPlaceSearchContext] = useState(null);
  const [aiRecommendedCourses, setAiRecommendedCourses] = useState([]);
  const [favoritePickerContext, setFavoritePickerContext] = useState(null);
  const [editingPublishSettingsForTripId, setEditingPublishSettingsForTripId] = useState(null);
  const [editingHotelDetails, setEditingHotelDetails] = useState(null);

  useEffect(() => {
    // ローカルストレージからトークンを読み込み、自動ログイン試行 (任意)
    const storedToken = localStorage.getItem('authToken');
    const storedUser = localStorage.getItem('authUser');
    if (storedToken && storedUser) {
      setCurrentUser({ ...JSON.parse(storedUser), token: storedToken });
      // TODO: トークン検証APIを呼び出し、有効ならユーザー情報を取得してsetUserProfile
      setCurrentScreen('tripList');
    }
  }, []);


  useEffect(() => {
    const authScreens = ['login', 'signup', 'passwordReset', 'accountDeletionConfirm'];
    if (!currentUser && !authScreens.includes(currentScreen)) { setCurrentScreen('login'); }
    else if (currentUser && authScreens.includes(currentScreen) && currentScreen !== 'accountDeletionConfirm') { setCurrentScreen('tripList'); }
  }, [currentUser, currentScreen]);

  const handleSignup = async (signupData) => {
    try {
      const response = await axios.post(`${BACKEND_URL}/api/auth/signup`, signupData);
      const { user } = response.data; // トークンはsignup時には返さない想定
      // setCurrentUser({ id: user.id, nickname: user.nickname, email: user.email, token: null }); // signup直後はトークンなし
      // setUserProfile({ nickname: user.nickname, email: user.email, bio: '', avatarUrl: '', favoritePlaces: [] });
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
      const response = await axios.post(`${BACKEND_URL}/api/auth/login`, loginData);
      const { token, user } = response.data;
      setCurrentUser({ id: user.id, nickname: user.nickname, email: user.email, token });
      setUserProfile(prev => ({...prev, nickname: user.nickname, email: user.email })); // プロフィール情報も更新
      localStorage.setItem('authToken', token); // トークンを保存
      localStorage.setItem('authUser', JSON.stringify({id: user.id, nickname: user.nickname, email: user.email }));
      setCurrentScreen('tripList');
    } catch (error) {
      console.error('Login failed:', error.response ? error.response.data : error.message);
      alert(`ログインに失敗しました: ${error.response?.data?.error || error.message}`);
    }
  };

  const handleLogout = () => {
    if (window.confirm('本当にログアウトしますか？')) {
      setCurrentUser(null);
      localStorage.removeItem('authToken');
      localStorage.removeItem('authUser');
      setCurrentScreen('login');
    }
  };

  // 他のハンドラ関数は変更なし (内容は省略)
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
  const handleShowProfileEdit = () => setCurrentScreen('profileEdit');
  const handleSaveProfile = (updatedProfile) => { setUserProfile(prevProfile => ({ ...prevProfile, ...updatedProfile })); setCurrentScreen('myProfile'); };
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
