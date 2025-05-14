"use client";
import React, { useState } from "react";
import { Label } from "./ui/label";
import { Input } from "./ui/input";
import { cn } from "@/lib/utils";
import { ColourfulText } from "./ui/colourful-text";
import axios from "axios";

//
// ********************* Drawer

import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "@/components/ui/drawer";

import { Button } from "@/components/ui/button";
import { FileUpload } from "@/components/ui/file-upload";

export default function DrawerOpen({
  name = "",
  title = "",
  desc = "",
  setAvatarImages, // Receive the setter function as a prop
  setCoverImages, // Receive the setter function as a prop
}) {
  return (
    <div>
      <Drawer>
        <div>
          <DrawerTrigger className="group/btn  relative block h-8 w-40 rounded-md bg-gradient-to-br from-black to-neutral-600 font-medium text-white shadow-[0px_1px_0px_0px_#ffffff40_inset,0px_-1px_0px_0px_#ffffff40_inset] dark:bg-zinc-800 dark:from-zinc-900 dark:to-zinc-900 dark:shadow-[0px_1px_0px_0px_#27272a_inset,0px_-1px_0px_0px_#27272a_inset]">
            {`${name}`}
          </DrawerTrigger>
        </div>
        <DrawerContent>
          <DrawerHeader>
            <DrawerTitle className="text-center">{`${title}`}</DrawerTitle>
            <DrawerDescription className="text-center">{`${desc}`}</DrawerDescription>
          </DrawerHeader>
          <FileUploadDemo
            setAvatarImages={setAvatarImages}
            setCoverImages={setCoverImages}
          />
          {/* <DrawerFooter>
            <Button>Submit</Button>
            <DrawerClose>
              <Button variant="outline">Cancel</Button>
            </DrawerClose>
          </DrawerFooter> */}
        </DrawerContent>
      </Drawer>
    </div>
  );
}

// *********************** Drawer
//
// ************************* FIleupload

export function FileUploadDemo({ setAvatarImages, setCoverImages }) {
  const handleFileUpload = (files) => {
    console.log("Files uploaded:", files);
    // You might want to differentiate between avatar and cover images here
    // based on how this component is used.
    // For now, we'll just pass them up.
    if (setAvatarImages) {
      setAvatarImages(files);
    }
    if (setCoverImages) {
      setCoverImages(files);
    }
  };

  return (
    <div className="w-full max-w-2xl mx-auto min-h-46 border border-dashed bg-white dark:bg-black border-neutral-200 dark:border-neutral-800 rounded-lg">
      <FileUpload onChange={handleFileUpload} />
    </div>
  );
}

// ************************* FIleupload
//
//
export function SignupFormDemo() {
  //
  const [fullName, setFullName] = useState("");
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [avatarImages, setAvatarImages] = useState([]);
  const [coverImages, setCoverImages] = useState([]);

  //
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (password !== confirmPassword) {
      alert("Passwords do not match !!!");
      return;
    }

    if (!avatarImages || avatarImages.length === 0) {
      alert("Avatar image is required !!!");
      return;
    }

    const formData = new FormData();
    formData.append("fullName", fullName);
    formData.append("username", username);
    formData.append("email", email);
    formData.append("password", password);

    // Append avatar images
    avatarImages.forEach((file) => {
      formData.append("avatar", file);
    });

    // Append cover images (if any)
    coverImages.forEach((file) => {
      formData.append("coverImage", file);
    });

    try {
      const response = await axios.post(
        "http://localhost:8000/api/v1/users/register",
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        }
      );
      if (response.status === 201) {
        console.log("Registration Successful:", response.data);
        alert("Registration successful!");
      } else {
        console.error("Registration Failed:", response.data);
        alert(
          `Registration failed: ${
            response.data?.message || "Something went wrong"
          }`
        );
      }
    } catch (error) {
      console.error("Error sending request:", error);
      alert("Failed to connect to the server.");
      if (error.response) {
        console.error("Server responded with:", error.response.data);
        console.error("Status code:", error.response.status);
        console.error("Headers:", error.response.headers);
        alert(
          `Registration failed: ${
            error.response.data?.message || "Something went wrong on the server"
          }`
        );
      } else if (error.request) {
        console.error("No response received:", error.request);
        alert("No response received from the server.");
      } else {
        console.error("Error setting up request:", error.message);
        alert("Error setting up the request.");
      }
    }
    console.log("Form submitted");
  };

  //
  //
  return (
    <div className="shadow-input mx-auto w-full max-w-md rounded-none bg-white p-4 md:rounded-2xl md:p-8 dark:bg-black">
      <h2 className="text-2xl font-bold text-neutral-800 dark:text-neutral-200">
        Welcome to <ColourfulText text="Pixel Play" />
      </h2>
      <p className="mt-2 max-w-sm  text-sm text-neutral-600 dark:text-neutral-300">
        {/* A Beautiful and Modern Looking Video Platform */}
      </p>

      <form className="my-8" onSubmit={handleSubmit}>
        <div className="mb-4 flex flex-col space-y-2 md:flex-row md:space-y-0 md:space-x-2">
          <LabelInputContainer>
            <Label htmlFor="firstname">Full Name</Label>
            <Input
              id="firstname"
              placeholder="Enter Your full name ..."
              type="text"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
            />
          </LabelInputContainer>{" "}
          <LabelInputContainer>
            <Label htmlFor="lastname">UserName</Label>
            <Input
              id="lastname"
              placeholder="Enter unique username ..."
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
            />
          </LabelInputContainer>
        </div>
        <div className="mb-4 flex gap-10">
          <DrawerOpen
            name="Upload Avatar"
            title="Avatar Images"
            desc="Upload Your Avatar Images here"
            setAvatarImages={setAvatarImages} // Pass the setter function as a prop
          />
          <DrawerOpen
            name="Upload Cover"
            title="Cover Images"
            desc="Upload Your Cover Images here"
            setCoverImages={setCoverImages} // Pass the setter function as a prop
          />
        </div>

        <LabelInputContainer className="mb-4">
          <Label htmlFor="email">Email Address</Label>
          <Input
            id="email"
            placeholder="enter email addess ...@gmail.com"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </LabelInputContainer>
        <LabelInputContainer className="mb-4">
          <Label htmlFor="password">Password</Label>
          <Input
            id="password"
            placeholder="••••••••"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </LabelInputContainer>
        <LabelInputContainer className="mb-8">
          <Label htmlFor="Pixel Play">Your Pixel Play password</Label>
          <Input
            id="Pixel Play"
            placeholder="••••••••"
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
          />
        </LabelInputContainer>

        <button
          className="group/btn relative block h-10 w-full rounded-md bg-gradient-to-br from-black to-neutral-600 font-medium text-white shadow-[0px_1px_0px_0px_#ffffff40_inset,0px_-1px_0px_0px_#ffffff40_inset] dark:bg-zinc-800 dark:from-zinc-900 dark:to-zinc-900 dark:shadow-[0px_1px_0px_0px_#27272a_inset,0px_-1px_0px_0px_#27272a_inset]"
          type="submit"
        >
          Sign up &rarr;
          <BottomGradient />
        </button>
      </form>
    </div>
  );
}

const BottomGradient = () => {
  return (
    <>
      <span className="absolute inset-x-0 -bottom-px block h-px w-full bg-gradient-to-r from-transparent via-cyan-500 to-transparent opacity-0 transition duration-500 group-hover/btn:opacity-100" />
      <span className="absolute inset-x-10 -bottom-px mx-auto block h-px w-1/2 bg-gradient-to-r from-transparent via-indigo-500 to-transparent opacity-0 blur-sm transition duration-500 group-hover/btn:opacity-100" />
    </>
  );
};

const LabelInputContainer = ({ children, className }) => {
  return (
    <div className={cn("flex w-full flex-col space-y-2", className)}>
      {children}
    </div>
  );
};
