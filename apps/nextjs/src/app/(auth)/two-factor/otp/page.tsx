"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { AlertCircle, CheckCircle2, Mail } from "lucide-react";

import { Button } from "@acme/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@acme/ui/card";
import { Input } from "@acme/ui/input";
import { Label } from "@acme/ui/label";

import { authClient as client } from "~/auth/client";

export default function Component() {
  const [otp, setOtp] = useState("");
  const [isOtpSent, setIsOtpSent] = useState(false);
  const [message, setMessage] = useState("");
  const [isError, setIsError] = useState(false);
  const [isValidated, setIsValidated] = useState(false);

  // In a real app, this email would come from your authentication context
  const userEmail = "user@example.com";

  const requestOTP = async () => {
    const _res = await client.twoFactor.sendOtp();
    // In a real app, this would call your backend API to send the OTP
    setMessage("OTP sent to your email");
    setIsError(false);
    setIsOtpSent(true);
  };
  const router = useRouter();

  const validateOTP = async () => {
    const res = await client.twoFactor.verifyOtp({
      code: otp,
    });
    if (res.data) {
      setMessage("OTP validated successfully");
      setIsError(false);
      setIsValidated(true);
      router.push("/");
    } else {
      setIsError(true);
      setMessage("Invalid OTP");
    }
  };
  return (
    <main className="flex min-h-[calc(100vh-10rem)] flex-col items-center justify-center">
      <Card className="w-[350px]">
        <CardHeader>
          <CardTitle>Two-Factor Authentication</CardTitle>
          <CardDescription>
            Verify your identity with a one-time password
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid w-full items-center gap-4">
            {!isOtpSent ? (
              <Button onClick={requestOTP} className="w-full">
                <Mail className="mr-2 h-4 w-4" /> Send OTP to Email
              </Button>
            ) : (
              <>
                <div className="flex flex-col space-y-1.5">
                  <Label htmlFor="otp">One-Time Password</Label>
                  <Label className="py-2">
                    Check your email at {userEmail} for the OTP
                  </Label>
                  <Input
                    id="otp"
                    placeholder="Enter 6-digit OTP"
                    value={otp}
                    onChange={(e) => setOtp(e.target.value)}
                    maxLength={6}
                  />
                </div>
                <Button
                  onClick={validateOTP}
                  disabled={otp.length !== 6 || isValidated}
                >
                  Validate OTP
                </Button>
              </>
            )}
          </div>
          {message && (
            <div
              className={`mt-4 flex items-center gap-2 ${
                isError ? "text-red-500" : "text-primary"
              }`}
            >
              {isError ? (
                <AlertCircle className="h-4 w-4" />
              ) : (
                <CheckCircle2 className="h-4 w-4" />
              )}
              <p className="text-sm">{message}</p>
            </div>
          )}
        </CardContent>
      </Card>
    </main>
  );
}
