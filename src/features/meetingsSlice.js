import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import axios from 'axios';
import { db } from '../firebase';
import { collection, doc, getDoc, setDoc } from 'firebase/firestore';


//------------- Meetings ---------------------
//Async thunk to send both 'meetings' and 'availability' data to backend
export const postMeetingData = createAsyncThunk(
  'meeting/postMeetingData',
  async (meetingData, thunkAPI) => {
    try {
      // Flatten the availability data structure and filter out dates without timeslots
      const flattenedAvailability = meetingData.availability.flatMap(date => (
        date.slots.map(slot => ({
          date: date.date,
          start_time: slot.start_time || null, // Set to null if not provided
          end_time: slot.end_time || null, // Set to null if not provided
          repeats: slot.repeats,
        }))
      )).filter(slot => slot.start_time && slot.end_time); // Only include slots with both start_time and end_time

      const response = await axios.post('https://capstone-project-api.chungmangjie200.repl.co/meetings', {
        ...meetingData,
        meeting: {
          ...meetingData.meeting,
        },
        availability: flattenedAvailability,
      });

      return response.data;
    } catch (error) {
      return thunkAPI.rejectWithValue({ error: error.message });
    }
  }
);

//Async thunk to update both 'meetings' and 'availability' data
export const updateMeetingData = createAsyncThunk(
  'meeting/updateMeetingData',
  async ({ id, meetingData }, thunkAPI) => {
    try {
      // Flatten the availability data structure and filter out dates without timeslots
      const flattenedAvailability = meetingData.availability.flatMap(date => (
        date.slots.map((slot, slotIndex) => {
          const slotData = {
            date: date.date,
            start_time: slot.start_time || null, // Set to null if not provided
            end_time: slot.end_time || null, // Set to null if not provided
            repeats: slot.repeats,
          };
          if (slot.id) {
            slotData.id = slot.id; // Only include the ID if it exists
          }
          return slotData;
        })
      )).filter(slot => slot.start_time && slot.end_time); // Only include slots with both start_time and end_time


      const response = await axios.put(`https://capstone-project-api.chungmangjie200.repl.co/meetings/${id}`, {
        ...meetingData,
        meeting: {
          ...meetingData.meeting,
        },
        availability: flattenedAvailability,
      });

      return response.data;
    } catch (error) {
      return thunkAPI.rejectWithValue({ error: error.message });
    }
  }
);

//Async thunk to fetch meeting by ID
export const fetchMeetingById = createAsyncThunk(
    'meetings/fetchMeetingById',
    async(meetingId) => {
        const response = await axios.get(`https://capstone-project-api.chungmangjie200.repl.co/api/meetings/${meetingId}`);
        return response.data
    }
)
  
//Async thunk to fetch all meetings details
export const fetchMeetingsByUser = createAsyncThunk(
  'meetings/fetchMeetingsByUser',
  async(userUid) => {
    try {
      const response = await axios.post(`https://capstone-project-api.chungmangjie200.repl.co/api/meetings`, { userUid });
      return response.data
    } catch(error){
      console.log(error)
    }
  }
)

//Async thunk to delete a specific meeting & cascade to other tables as well
export const deleteMeetingById = createAsyncThunk(
  'meetings/deleteMeetingById',
  async(meetingId) => {
    try {
      await axios.delete(`https://capstone-project-api.chungmangjie200.repl.co/meetings/${meetingId}`);
      return meetingId
    } catch(error){
      console.log(error)
    }
  }
)

//------------- Users ---------------------
//Async thunk to fetch user details
export const fetchUser = createAsyncThunk(
  'user/fetchUser',
  async(userUid, thunkAPI) => {
    try {
      const response = await axios.post(`https://capstone-project-api.chungmangjie200.repl.co/api/user`, { userUid });
      return response.data
    } catch(error){
      return thunkAPI.rejectWithValue({ error: error.message });
    }
  }
)

// Async thunk to update name and profile pic
export const updateUserInfo = createAsyncThunk(
  'user/updateUserInfo',
  async ({ id, name, profile_picture }, thunkAPI) => {
    try {
      const response = await axios.put(
        `https://capstone-project-api.chungmangjie200.repl.co/users/${id}`,
        {
          name,
          profile_picture,
        }
      );
      console.log('user updated');
      return response.data;
    } catch (error) {
      return thunkAPI.rejectWithValue({ error: error.message });
    }
  }
);

//------------- Guest Meeting ---------------------
//Async thunk to create a guest meeting
export const createGuestMeeting = createAsyncThunk(
  'guest/createGuestMeeting',
  async({guestMeetingData}) => {
    try{
      const response = await axios.post(`https://capstone-project-api.chungmangjie200.repl.co/guestmeeting`, guestMeetingData );
      return response.data
    } catch(error){
      console.log(error)

    }
  }
)

//Async thunk to fetch guest meeting
export const fetchGuestMeeting = createAsyncThunk(
  'guest/fetchGuestMeeting',
  async (meetingId) => {
    try {
      const response = await axios.get(`https://capstone-project-api.chungmangjie200.repl.co/fetchguestmeeting/${meetingId}`);
      return response.data;
    } catch (error) {
      console.log(error);
      throw error;
    }
  }
);

//------------- Third party API ---------------------
//Async thunk to send email using NodeMailer
export const sendEmail = createAsyncThunk(
  'guest/sendEmail',
  async ({to, subject, html}, thunkAPI) => {

    try {
      const response = await axios.post(`https://capstone-project-api.chungmangjie200.repl.co/sendemail`, {to, subject, html});
      
      if (response.status !== 200) {
        // You can customize the error message based on the response if needed
        return thunkAPI.rejectWithValue('Failed to send email');
      }

      return response.data;
    } catch (error) {
      // Log the error and reject it to propagate it to the calling code
      console.log(error);
      return thunkAPI.rejectWithValue(error.response?.data || 'An error occurred while sending the email');
    }
  }
);

//Async thunk to create google calander meeting
export const googleCalMeeting = createAsyncThunk(
  'guest/googleCalMeeting',
  async (googleCalData, thunkAPI) => {
    try {
      const guestMeetingsRef = collection(db, 'guestMeetings');

      const newGuestMeetingRef = doc(guestMeetingsRef);

      await setDoc(newGuestMeetingRef, googleCalData)

      const newGuestMeeting = await getDoc(newGuestMeetingRef);

      console.log(newGuestMeeting.data())
    } catch(error) {
      console.log(error)
      return thunkAPI.rejectWithValue(error.response?.data || 'An error occurred while creating google calander meeting');
    }
  }
)


//------------- Synchronous actions & Reducers ---------------------
const meetingSlice = createSlice({
  name: 'meeting',
  initialState: {
    meeting: {
      meeting_name: '',
      location: 'zoom',
      description: '',
      custom_url: '',
      event_duration: '30',
      time_slot_increment: '30',
      date_range: '7',
      reminder_days: '30',
      user_uid: '',
    },
    loading: true, // add loading to track request status
    allMeetings: [],
    user: {},
    guestMeeting: [],
  },
  reducers: {
    saveMeeting: (state, action) => {
      state.meeting = action.payload;
    },
    resetMeeting: (state) => {
      state.meeting = {
        meeting_name: '',
        location: 'zoom',
        description: '',
        custom_url: '',
        event_duration: '30',
        time_slot_increment: '30',
        date_range: '7',
        reminder_days: '30',
        user_uid: '',
      };
    },
    clearAllMeetings: (state) => {
      state.allMeetings = [];
    },
    clearUser: (state) => {
      state.user = {};
    }
  },
  //------------- Asynchronous Reducers ---------------------
  extraReducers: (builder) => {
    builder
      .addCase(postMeetingData.fulfilled, (state, action) => {
        state.status = 'succeeded';
        // Add any other state changes you need on success
      })
      .addCase(fetchMeetingById.fulfilled, (state,action) => {
        state.meeting = action.payload;
        state.loading = false;
      })
      .addCase(fetchMeetingsByUser.fulfilled, (state, action) => {
        state.allMeetings = action.payload
        state.loading = false;

      })
      .addCase(deleteMeetingById.fulfilled, (state, action) => {
        const meetingId = action.payload

        state.allMeetings = state.allMeetings.filter((meeting) => meeting.id !== meetingId)
      })
      .addCase(updateMeetingData.fulfilled, (state, action) => {
        state.status = 'succeeded';
        // Add any other state changes you need on success
      })
      .addCase(fetchUser.fulfilled, (state, action) => {
        state.user = action.payload;
        state.loading = false;

      })
      .addCase(createGuestMeeting.fulfilled, (state,action) => {
        state.status = 'succeeded';
      })
      .addCase(fetchGuestMeeting.fulfilled, (state, action) => {
        state.guestMeeting = action.payload;
      });
  }
});

export const { saveMeeting, resetMeeting, clearAllMeetings, clearUser } = meetingSlice.actions;  //Export synchronous actions

export default meetingSlice.reducer;
