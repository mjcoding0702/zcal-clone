import {
  BrowserRouter,
  Outlet,
  Route,
  Routes,
  useLocation,
} from 'react-router-dom';
import { AuthContext, AuthProvider } from './components/AuthProvider';
import AuthPage from './pages/AuthPage';
import { auth } from './firebase';
import { useContext } from 'react';
import { Container, Navbar, Dropdown } from 'react-bootstrap';
import AvailabilityForm from './pages/AvailabilityForm';
import MeetingForm from './pages/MeetingForm';
import { Provider, useDispatch } from 'react-redux';
import store from './store';
import CreateSuccessPage from './pages/CreateSuccessPage';
import BookMeetingPage from './pages/BookMeetingPage';
import Home from './pages/Home';
import { clearAllMeetings, resetMeeting } from './features/meetingsSlice';
import { resetAvailability } from './features/availabilitySlice';
import { LocalizationProvider } from '@mui/x-date-pickers';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import ProfilePage from './pages/ProfilePage';
import { Link } from 'react-router-dom';
import { useSelector } from 'react-redux/es/hooks/useSelector';

function Layout() {
  const { currentUser } = useContext(AuthContext);
  // Su's part from here
  const user = useSelector((state) => state.meeting.user);
  const icon = user.userDetails?.profile_picture;

  const iconCleaned = icon?.replace(/["\\]/g, '');
  // till here

  const location = useLocation();
  const dispatch = useDispatch();
  const handleLogout = () => {
    auth.signOut();
    dispatch(clearAllMeetings());
    dispatch(resetAvailability());
    dispatch(resetMeeting());
  };

  return (
    <>
      <Navbar bg='light' variant='light' className='mb-3'>
        <Container className='justify-content-between gap-4'>
          <Navbar.Brand href='/'>
            <img
              src='https://firebasestorage.googleapis.com/v0/b/mentor-mentee-booking-system.appspot.com/o/meetings%2Fdownload.png?alt=media&token=d7898c68-1a0d-4ae8-9499-52d128e314fd'
              style={{ width: 80, height: 'auto' }}
            ></img>
          </Navbar.Brand>
          {currentUser && !location.pathname.startsWith('/bookmeeting') && (
            // su's part from here
            <Dropdown>
              <Dropdown.Toggle
                variant='light'
                id='dropdown-basic'
                style={{
                  width: '50px',
                  height: '50px',
                  overflow: 'hidden',
                  borderRadius: '50%',
                  backgroundColor: 'initial', // or set it to the background color you want
                }}
              >
                <img
                  src={iconCleaned}
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                />
              </Dropdown.Toggle>

              <Dropdown.Menu
                style={{
                  ':hover': {
                    backgroundColor: 'initial', // or set it to the background color you want
                  },
                }}
              >
                <Dropdown.Item>
                  <Link to='/profile' className='text-decoration-none text-black'>
                    Profile
                  </Link>
                </Dropdown.Item>
                <Dropdown.Item>
                  <Link to='/home' className='text-decoration-none text-black'>
                    Home
                  </Link>
                </Dropdown.Item>
                <Dropdown.Item onClick={handleLogout}>Log Out</Dropdown.Item>
              </Dropdown.Menu>
            </Dropdown>

            // till here
          )}
        </Container>
      </Navbar>
      <Outlet />
    </>
  );
}

export default function App() {
  return (
    <LocalizationProvider dateAdapter={AdapterDayjs}>
      <AuthProvider>
        <Provider store={store}>
          <BrowserRouter>
            <Routes>
              <Route path='/' element={<Layout />}>
                <Route index element={<AuthPage />} />
                <Route path='*' element={<AuthPage />} />
                <Route path='/login' element={<AuthPage />} />
                <Route path='/meeting/:meetingId' element={<MeetingForm />} />
                <Route path='/meeting' element={<MeetingForm />} />
                <Route path='/profile' element={<ProfilePage />} />
                <Route
                  path='/availability/:meetingId'
                  element={<AvailabilityForm />}
                />
                <Route path='/availability' element={<AvailabilityForm />} />
                <Route
                  path='/success/:meetingId'
                  element={<CreateSuccessPage />}
                />
                <Route
                  path='/bookmeeting/:meetingId'
                  element={<BookMeetingPage />}
                />
                <Route path='/home' element={<Home />} />
              </Route>
            </Routes>
          </BrowserRouter>
        </Provider>
      </AuthProvider>
    </LocalizationProvider>
  );
}
