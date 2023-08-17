import { useContext, useEffect, useState } from 'react';
import { Container } from 'react-bootstrap';
import { useNavigate, useParams } from 'react-router-dom';
import { fetchUser, resetMeeting } from '../features/meetingsSlice';
import { resetAvailability } from '../features/availabilitySlice';
import { useDispatch } from 'react-redux';
import { AuthContext } from '../components/AuthProvider';

function CreateSuccessPage() {
  const { meetingId } = useParams();
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const {currentUser} = useContext(AuthContext);

  const [isDrawn, setIsDrawn] = useState(false);

  useEffect(() => {
    dispatch(resetMeeting());
    dispatch(resetAvailability());
    dispatch(fetchUser(currentUser.uid));
    setIsDrawn(true);
  },[currentUser.uid, dispatch])

  //Log user out
  useEffect(() => {
    if(!currentUser){
      navigate('/login');
    }
  },[currentUser, navigate])

  return (
    <>
      <style>
        {`
          .center-container {
            width: 70%; /* Increase this value to set the desired width */
            max-width: 800px; /* Set a maximum width if needed */
            margin: 0 auto; /* Centers the container */
          }
          .circ{
              opacity: 0;
              stroke-dasharray: 130;
              stroke-dashoffset: 130;
              -webkit-transition: all 1s;
              -moz-transition: all 1s;
              -ms-transition: all 1s;
              -o-transition: all 1s;
              transition: all 1s;
          }
          .tick{
              stroke-dasharray: 50;
              stroke-dashoffset: 50;
              -webkit-transition: stroke-dashoffset 1s 0.5s ease-out;
              -moz-transition: stroke-dashoffset 1s 0.5s ease-out;
              -ms-transition: stroke-dashoffset 1s 0.5s ease-out;
              -o-transition: stroke-dashoffset 1s 0.5s ease-out;
              transition: stroke-dashoffset 1s 0.5s ease-out;
          }
          .drawn + svg .path{
              opacity: 1;
              stroke-dashoffset: 0;
          }
        `}
      </style>

      <Container className='center-container d-flex flex-column align-items-center' style={{marginTop: '200px'}}>
        <div className={isDrawn ? 'trigger drawn' : 'trigger'}></div>
        <svg version="1.1" id="tick" xmlns="http://www.w3.org/2000/svg" xmlnsXlink="http://www.w3.org/1999/xlink" x="0px" y="0px"
          viewBox="0 0 37 37" style={{ enableBackground: 'new 0 0 37 37', width: '200px' }} xmlSpace="preserve">
          <path className="circ path" style={{ fill: 'none', stroke: '#000', strokeWidth: 3, strokeLinejoin: 'round', strokeMiterlimit: 10 }} d="
            M30.5,6.5L30.5,6.5c6.6,6.6,6.6,17.4,0,24l0,0c-6.6,6.6-17.4,6.6-24,0l0,0c-6.6-6.6-6.6-17.4,0-24l0,0C13.1-0.2,23.9-0.2,30.5,6.5z"
            />
          <polyline className="tick path" style={{ fill: 'none', stroke: '#000', strokeWidth: 3, strokeLinejoin: 'round', strokeMiterlimit: 10 }} points="
            11.6,20 15.9,24.2 26.4,13.8 " />
        </svg>
        <h1 className='my-4 text-center'>Meeting Created Successfully!</h1>
        <p className='fs-5 text-center'>Your meeting invite link: <a href={`/bookmeeting/${meetingId}`}>/bookmeeting/{meetingId}</a></p>
      </Container>
    </>
  );
}

export default CreateSuccessPage;
