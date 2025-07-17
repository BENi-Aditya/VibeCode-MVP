import React from "react";
import { GoogleLogin } from '@react-oauth/google';
import { Button } from "@/components/ui/button";

interface GoogleLoginButtonProps {
  onSuccess: (credential: any) => void;
}

const GoogleLoginButton: React.FC<GoogleLoginButtonProps> = ({ onSuccess }) => {
  return (
    <div className="w-full">
      <GoogleLogin
        onSuccess={onSuccess}
        onError={() => console.error('Google Login Failed')}
        useOneTap={false}
        theme="filled_black"
        size="large"
        text="continue_with"
        shape="pill"
        width="100%"
      />
    </div>
  );
};

export default GoogleLoginButton;
