import React, { useState } from 'react';
import { useAppState } from '../../context/AppContext';
import { toast } from 'sonner';
import { Lock, Mail, ArrowRight, Eye, EyeOff, User } from 'lucide-react';
import axios from 'axios';


export default function Login() {
  const { dispatch } = useAppState();

  const [isSignUp, setIsSignUp] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);


  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (isSignUp && (!name || name.trim().length < 2)) {
      toast.error('Please enter a valid name');
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!email || !emailRegex.test(email)) {
      toast.error('Please enter a valid email address');
      return;
    }


    if (!password || password.length < 6) {
      toast.error('Password must be at least 6 characters long');
      return;
    }


    setIsLoading(true);


    try {
      const endpoint = isSignUp 
        ? 'http://localhost:8000/api/auth/signup' 
        : 'http://localhost:8000/api/auth/login';

      const payload = isSignUp 
        ? { name, email, password } 
        : { email, password };

      const response = await axios.post(endpoint, payload);

      const user = response.data.admin || response.data.user;
      const token = response.data.token || "dummy-token";

      // Save token
      localStorage.setItem("token", token);

      // Save user details
      localStorage.setItem("user", JSON.stringify(user));

      toast.success(isSignUp ? 'Successfully signed up!' : 'Successfully logged in!');

      dispatch({
        type: 'LOGIN',
        payload: {
          name: user?.name || name || 'Admin',
          email: user?.email || email
        }
      });

    } catch (error: any) {
      console.log(error);

      if (error.response) {
        toast.error(error.response?.data?.message || (isSignUp ? 'Signup failed' : 'Login failed'));
      } 
      else {
        toast.error('Backend server is not reachable');
      }

    } finally {
      setIsLoading(false);
    }
  };
  // Initiates Google OAuth flow in a popup and handles the result
  const handleGoogleLogin = () => {
    const googleAuthUrl = "http://localhost:8000/api/auth/google/connect";
    const msgHandler = (event) => {
      if (!event.data) return;
      let data = event.data;
      if (typeof data === "string") {
        try { data = JSON.parse(data); } catch (_) { return; }
      }
      if (!data || !data.type) return;

      if (data.type === "google_authed" || data.type === "google_profile") {
        // Save token and user info
        if (data.token) localStorage.setItem("token", data.token);
        const userInfo = { name: data.name, email: data.email };
        localStorage.setItem("user", JSON.stringify(userInfo));
        // Update app state
        dispatch({ type: "LOGIN", payload: userInfo });
        // Close popup if opened via window.opener
        if (window.opener) {
          window.opener.postMessage({ type: "google_complete" }, "*");
        }
        // Reload to reflect logged-in state
        window.location.reload();
      }
    };
    window.addEventListener("message", msgHandler);
    const popup = window.open(
      googleAuthUrl,
      "fa_google_auth",
      "width=640,height=840,top=40,left=80,toolbar=no,menubar=no"
    );
    if (!popup || popup.closed) {
      window.removeEventListener("message", msgHandler);
      toast.error("Popup was blocked. Please allow popups and try again.");
    } else {
      // Bring the popup to the front — without this it can open behind
      // the main window in some browsers/OS window managers.
      popup.focus();
    }
  };


  return (
    <div style={{
      minHeight: '100vh',
      width: '100vw',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: '#ffffff',
      position: 'fixed',
      top: 0,
      left: 0,
      zIndex: 9999
    }}>

      <div style={{
        background: '#ffffff',
        padding: '48px',
        borderRadius: '24px',
        border: '1px solid #e2e8f0',
        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
        width: '100%',
        maxWidth: '440px',
        position: 'relative',
        zIndex: 1
      }} className="fade-in">


        <div style={{ textAlign: 'center', marginBottom: '32px' }}>

          <div style={{
            width: '64px',
            height: '64px',
            background: 'linear-gradient(135deg, var(--primary) 0%, #2563eb 100%)',
            borderRadius: '16px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'white',
            fontSize: '1.5rem',
            fontWeight: 800,
            margin: '0 auto 16px',
            boxShadow: '0 10px 15px -3px rgba(37, 99, 235, 0.3)'
          }}>
            FA
          </div>


          <h1 style={{
            fontSize: '1.75rem',
            fontWeight: 700,
            color: '#1e293b',
            marginBottom: '8px'
          }}>
            {isSignUp ? 'Create an account' : 'Welcome back'}
          </h1>


          <p style={{
            color: '#64748b',
            fontSize: '0.95rem'
          }}>
            {isSignUp ? 'Sign up to access your accounting workspace' : 'Sign in to access your accounting workspace'}
          </p>

        </div>



        <form 
        onSubmit={handleSubmit}
        style={{
          display:'flex',
          flexDirection:'column',
          gap:'20px'
        }}>

          {isSignUp && (
            <div>
              <label 
              htmlFor="name"
              style={{
                display:'block',
                marginBottom:'8px',
                fontSize:'0.85rem',
                fontWeight:600,
                color:'#475569'
              }}>
                Full Name
              </label>

              <div style={{position:'relative'}}>
                <div style={{
                  position:'absolute',
                  left:'16px',
                  top:'50%',
                  transform:'translateY(-50%)',
                  color:'#94a3b8'
                }}>
                  <User size={18}/>
                </div>

                <input
                id="name"
                type="text"
                value={name}
                onChange={(e)=>setName(e.target.value)}
                placeholder="Enter Full Name"
                style={{
                  width:'100%',
                  padding:'12px 16px 12px 44px',
                  borderRadius:'12px',
                  border:'1px solid #e2e8f0',
                  fontSize:'0.95rem',
                  outline:'none'
                }}
                />
              </div>
            </div>
          )}

          <div>
            <label 
            htmlFor="email"
            style={{
              display:'block',
              marginBottom:'8px',
              fontSize:'0.85rem',
              fontWeight:600,
              color:'#475569'
            }}>
              Email Address
            </label>

            <div style={{position:'relative'}}>
              <div style={{
                position:'absolute',
                left:'16px',
                top:'50%',
                transform:'translateY(-50%)',
                color:'#94a3b8'
              }}>
                <Mail size={18}/>
              </div>

              <input
              id="email"
              type="email"
              value={email}
              onChange={(e)=>setEmail(e.target.value)}
              placeholder="Enter Email Id"
              style={{
                width:'100%',
                padding:'12px 16px 12px 44px',
                borderRadius:'12px',
                border:'1px solid #e2e8f0',
                fontSize:'0.95rem',
                outline:'none'
              }}
              />
            </div>
          </div>


          <div>
            <label 
            htmlFor="password"
            style={{
              display:'block',
              marginBottom:'8px',
              fontSize:'0.85rem',
              fontWeight:600,
              color:'#475569'
            }}>
              Password
            </label>

            <div style={{position:'relative'}}>
              <div style={{
                position:'absolute',
                left:'16px',
                top:'50%',
                transform:'translateY(-50%)',
                color:'#94a3b8'
              }}>
                <Lock size={18}/>
              </div>

              <input
              id="password"
              type={showPassword ? "text":"password"}
              value={password}
              onChange={(e)=>setPassword(e.target.value)}
              placeholder="Enter Password"
              style={{
                width:'100%',
                padding:'12px 44px',
                borderRadius:'12px',
                border:'1px solid #e2e8f0',
                fontSize:'0.95rem',
                outline:'none'
              }}
              />

              <button
              type="button"
              onClick={()=>setShowPassword(!showPassword)}
              style={{
                position:'absolute',
                right:'16px',
                top:'50%',
                transform:'translateY(-50%)',
                background:'none',
                border:'none',
                color:'#94a3b8',
                cursor:'pointer'
              }}
              >
                {showPassword ? <EyeOff size={18}/> : <Eye size={18}/>}
              </button>
            </div>
          </div>

          <button
          type="submit"
          disabled={isLoading}
          style={{
            background:'linear-gradient(135deg,var(--primary) 0%,#2563eb 100%)',
            color:'white',
            border:'none',
            padding:'14px',
            borderRadius:'12px',
            fontSize:'1rem',
            fontWeight:600,
            cursor:isLoading?'not-allowed':'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px',
            marginTop: '8px'
          }}
          >
            {isLoading ? (isSignUp ? 'Signing up...' : 'Signing in...') : (
              <>
                {isSignUp ? 'Sign Up' : 'Sign In'} <ArrowRight size={18}/>
              </>
            )}
          </button>

          <div style={{ textAlign: 'center', margin: '16px 0', color: '#64748b', fontSize: '0.9rem' }}>OR</div>

          <button
            type="button"
            onClick={handleGoogleLogin}
            style={{
              width: '100%',
              padding: '12px',
              borderRadius: '12px',
              border: '1px solid #e2e8f0',
              background: 'white',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '10px',
              fontSize: '0.95rem',
              fontWeight: 600,
              color: '#334155',
              cursor: 'pointer'
            }}
          >
            <img src="/google-icon.png" alt="Google" width="20" height="20" />
            Continue with Google
          </button>
          
          <div style={{
            textAlign: 'center',
            marginTop: '8px',
            fontSize: '0.9rem',
            color: '#64748b'
          }}>
            {isSignUp ? "Already have an account? " : "Don't have an account? "}
            <button
              type="button"
              onClick={() => setIsSignUp(!isSignUp)}
              style={{
                background: 'none',
                border: 'none',
                color: '#2563eb',
                fontWeight: 600,
                cursor: 'pointer',
                padding: 0
              }}
            >
              {isSignUp ? 'Sign In' : 'Sign Up'}
            </button>
          </div>

        </form>

      </div>

    </div>
  );
}