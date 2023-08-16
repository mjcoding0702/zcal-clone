import { useContext, useEffect, useState } from "react";
import { Button, Col, Image, Row, Form, Modal } from "react-bootstrap";
import { useNavigate } from "react-router-dom";
import {auth, storage} from "../firebase"
import { AuthContext } from "../components/AuthProvider";
import { FacebookAuthProvider, GoogleAuthProvider, createUserWithEmailAndPassword, sendPasswordResetEmail, signInWithEmailAndPassword, signInWithPopup } from "@firebase/auth";
import axios from "axios";
import { getDownloadURL, ref, uploadBytes } from "firebase/storage";
import '../styles/AuthPage.css'


export default function AuthPage() {
    const [modalShow, setModalShow] = useState(null);
    const handleShowSignUp = () => setModalShow("SignUp");
    const handleShowLogin = () => setModalShow("Login");
    const handleResetPassword = () => setModalShow("Reset");

    const [email, setEmail] = useState("");
    const [name, setName] = useState("");
    const [password, setPassword] = useState("");
    const [errorMessage, setErrorMessage] = useState("");

    const [signUpComplete, setSignUpComplete] = useState(null);
    const [fullyAuthenticated, setFullyAuthenticated] = useState(false);

    //Profile Image
    const [imageToUpload, setImageToUpload] = useState(null);
    const handleImageChange = (e) => {
        setImageToUpload(e.target.files[0]);
      };
    

    //Firebase
    const navigate = useNavigate();
    const {currentUser} = useContext(AuthContext);

    // If currentUser is updated and exist, redirect into profile
    useEffect(() => {
        // Redirect if the user is fully authenticated OR if there's a currentUser and signUpComplete is not false
        if (fullyAuthenticated || (currentUser && signUpComplete !== false)) {
          navigate("/home");
        }
      }, [fullyAuthenticated, currentUser, signUpComplete, navigate]);
    

    //Reset password
    const handleResetPasswordEmail = async() => {
        try{
            alert("Email to reset password sent!")
            await sendPasswordResetEmail(auth, email)
        } catch(error){
            console.log(error);
        }
    }

    
    // Email & password login
    const handleLogin = async (e) => {
        e.preventDefault();
        try {
            await signInWithEmailAndPassword(auth, email, password)
            setSignUpComplete(true);
        } catch (error) {
            console.log(error);
        }
      };
      

    // Email & password sigup
    const handleSignUp = async (e) => {
        e.preventDefault();
        try {
            setSignUpComplete(false);
            const userCredential = await createUserWithEmailAndPassword(auth,email,password);
            const user = userCredential.user;
            const idToken = await user.getIdToken(true);

            let imageUrl = null;
    
            // Handle the image upload if a file has been selected
            if (imageToUpload) {
                const imageRef = ref(storage, `users/${user.uid}`);
                await uploadBytes(imageRef, imageToUpload);
                imageUrl = await getDownloadURL(imageRef);
                console.log(imageUrl)
              }

            const response = await axios.post(
                'https://capstone-project-api.chungmangjie200.repl.co/users', 
                {
                    token: idToken,
                    name: name,
                    email,
                    profilePicture: imageUrl, // Include the image URL in the request
                }
            )

            setSignUpComplete(true);
            setFullyAuthenticated(true); // Redirect the user only after everything is done
        } catch (error) {
            const errorCode = error.code;
            const errMessage = error.message;

            if (errorCode) setErrorMessage(errorCode);
            if (errMessage) setErrorMessage(errorCode);
        }
    };

    //Close Modal
    const handleClose = () => {
        setModalShow(null);
        setErrorMessage("");
    }

    // Determine the text for the button
    let buttonText = "Sign Up";
    if (modalShow === "Login") {
        buttonText = "Login";
    } else if (modalShow === "Reset Password") {
        buttonText = "Reset Password";
    }

    // Determine if the button should be disabled
    let isButtonDisabled = false;

    // If the modalShow is SignUp and signUpComplete is false (sign up is in progress), change the button text to "Signing Up..." and disable the button
    if (modalShow === "SignUp" && signUpComplete === false) {
        buttonText = "Signing Up...";
        isButtonDisabled = true;
    }

    return (
        <>
            <div className="container d-flex justify-content-center align-items-center min-vh-100">
                <div className="row border p-3 bg-white shadow rounded-5 box-area">
                    <div className="col-md-6  d-flex justify-content-center border rounded-4 align-items-center flex-column left-box">
                        <div className="featured-image mb-3 mt-2">
                            <img src="https://firebasestorage.googleapis.com/v0/b/clone-4b31b.appspot.com/o/login_youtube.png?alt=media&token=ddb5893c-c234-44f2-ae16-85a13c39d4d8" className="img-fluid" alt="Youtube logo" style={{width:'250px'}} />
                            <p className="text-black fs-2 my-2 fw-medium">Broadcast Yourself</p>
                            <small className="text-black text-wrap text-center" style={{width: '17rem'}}>Inspire others with your story</small>
                        </div>
                    </div>

                    <div className="col-md-6 pb-0 pb-md-3 p-3 p-md-5">
                        <div className="row align-items-center">
                            <div className="header-text mb-4 d-flex flex-column align-items-center">
                                <i className="bi bi-youtube " style={{fontSize: 50, color: "red"}}></i>
                                <p className="fw-medium fs-3 mb-2">Ready to Shine?</p>
                                <p>Login to YouTube Clone</p>
                                <Button className="rounded-pill w-100" variant="outline-dark" onClick={handleShowSignUp}>Create an account</Button>

                                <p className="mt-5" style={{fontWeight: "bold"}}>Already have an account?</p>
                                <Button className="rounded-pill w-100 mb-2" variant="outline-dark" onClick={handleShowLogin}>
                                    Sign in
                                </Button>

                                <Button className="rounded-pill w-100" variant="outline-dark" onClick={handleResetPassword}>
                                    Reset Password
                                </Button> 
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            <Modal show={modalShow !== null} onHide={handleClose} animation={false} centered>
                <Modal.Body>
                <h2 className='mb-4' style={{ fontWeight: "bold" }}>
                    {modalShow === "SignUp"? "Create your account" :modalShow === "Login"? "Log in to your account": "Reset Password"}
                </h2>
                {errorMessage && <p className="text-danger text-sm">{errorMessage}</p>}
                <Form className='d-grid gap-2 px-5' onSubmit={modalShow === "SignUp"? handleSignUp :modalShow === "Login"? handleLogin: handleResetPasswordEmail}>
                    {modalShow === "SignUp" && (
                        <Form.Group className='mb-3' controlId='formBasicImage'>
                        <Form.Control 
                            required
                            onChange={handleImageChange}
                            type='file' 
                            accept="image/*"
                        />
                        </Form.Group>
                    )}

                    <Form.Group className='mb-3' controlId='formBasicEmail'>
                        <Form.Control 
                        required
                        onChange={(e) => setEmail(e.target.value)}
                        type='email' 
                        placeholder='Enter Email' 
                        />
                    </Form.Group>

                    {modalShow === "SignUp" && (
                        <Form.Group className='mb-3' controlId='formBasicName'>
                        <Form.Control 
                            required
                            onChange={(e) => setName(e.target.value)}
                            type='text' 
                            placeholder='Enter Name' 
                        />
                        </Form.Group>
                    )}

                    {modalShow !== "Reset" && (
                        <Form.Group className='mb-3' controlId='formBasicPassword'>
                        <Form.Control 
                            required
                            onChange={(e) => setPassword(e.target.value)}
                            type='password' 
                            placeholder='Enter Password' 
                        />
                        </Form.Group>
                    )}

                    <p style={{ fontSize: "12px" }}>
                    By using our service, you agree to the terms of Service and Privacy
                    Policy, including Cookie Use. zCal Clone may use your contact
                    information, including your email address and phone number for
                    purposes outlined in our Privacy Policy, like keeping your account
                    secure and personalising our services, including ads. This is merely a placeholder text.
                    </p>

                    <Button className='rounded-pill' variant='outline-primary' type="submit" disabled={isButtonDisabled}>
                        {buttonText}
                    </Button>

                    
                </Form>
                </Modal.Body>
            </Modal>
        
        </>

        
    )
}
