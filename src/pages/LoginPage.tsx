import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogTrigger,
  AlertDialogCancel,
  AlertDialogAction,
} from "@/components/ui/alert-dialog";

import CustomCursor from "@/components/CustomCursor";
import GoogleLoginButton from "@/components/GoogleLoginButton";

const LoginPage = () => {
  const [name, setName] = useState("");
  const navigate = useNavigate();

  const handleLogin = () => {
    if (name.trim() !== "") {
      localStorage.setItem("username", name.trim());
      navigate("/ideation");
    }
  };

  const skipLogin = () => {
    localStorage.setItem("skipAuth", "true");
    navigate("/ideation");
  };

  const handleGoogleSuccess = async (credential: any) => {
    try {
      // Accept both string and object with .credential
      const idToken = typeof credential === 'string' ? credential : credential.credential;
      if (!idToken) throw new Error('No Google credential received');
      const res = await fetch('/api/auth/google', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ idToken })
      });
      const data = await res.json();
      if (data.success) {
        localStorage.setItem("user", JSON.stringify(data.user));
        navigate("/ideation");
      } else {
        alert('Google login failed: ' + (data.error || 'Unknown error'));
      }
    } catch (err: any) {
      alert('Google login error: ' + (err.message || err));
    }
  };



  return (
    <>
      <CustomCursor />
      <div className="relative flex items-center justify-center h-screen w-screen z-10">
      <div className="bg-black/60 backdrop-blur-sm p-8 rounded-xl shadow-2xl w-full max-w-md border border-white/10">
        <div className="flex flex-col items-center space-y-6">
          <img src="/logo.png" alt="VibeCode Logo" className="h-16" />
          <h1 className="text-3xl font-bold text-white">Welcome to VibeCode</h1>

          <Input
            placeholder="Enter your name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="text-white placeholder:text-gray-400"
          />

          <Button className="w-full" onClick={handleLogin} disabled={!name.trim()}>
            Continue
          </Button>

          <div className="w-full flex items-center gap-2 my-2">
            <div className="flex-1 h-px bg-white/20" />
            <span className="text-xs text-white/50">or</span>
            <div className="flex-1 h-px bg-white/20" />
          </div>

          <GoogleLoginButton onSuccess={handleGoogleSuccess} />

          <AlertDialog>
            <AlertDialogTrigger asChild>
              <button className="text-sm text-gray-300 hover:underline">
                Continue without login
              </button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Proceed without saving history?</AlertDialogTitle>
                <AlertDialogDescription>
                  If you continue without logging in your conversation history will not be saved.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={skipLogin}>Continue</AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </div>
    </div>
    </>
  );
};

export default LoginPage;
