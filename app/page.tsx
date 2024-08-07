// app/page.js
"use client";

import { useState, useEffect } from "react";
import { io, Socket } from "socket.io-client";

export default function Home() {
  const [room, setRoom] = useState<string | null>(null);
  const [timer, setTimer] = useState(0);
  const [timerRunning, setTimerRunning] = useState<boolean>(false);
  const [runCount, setRunCount] = useState<number>(0);
  const [socket, setSocket] = useState<Socket | null>(null);
  const [roomIdInput, setRoomIdInput] = useState<string>("");

  useEffect(() => {
    const newSocket = io("http://localhost:3001");
    setSocket(newSocket);

    return () => {
      newSocket.close();
    };
  }, []);

  function generateRandomString(length: number): string {
    const characters =
      "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*()_+[]{}|;:,.<>?";
    let result = "";
    for (let i = 0; i < length; i++) {
      const randomIndex = Math.floor(Math.random() * characters.length);
      result += characters[randomIndex];
    }
    return result;
  }

  useEffect(() => {
    if (socket) {
      socket.on("timer", (time) => setTimer(time));
      socket.on("timerStatus", (status) => setTimerRunning(status));
      socket.on("runCount", (count) => setRunCount(count));
      socket.on("roomClosed", () => {
        setRoom(null);
        setTimer(0);
        setTimerRunning(false);
        setRunCount(0);
      });
    }
  }, [socket]);

  const createRoom = async () => {
    try {
      if (socket) {
        const roomID = generateRandomString(10);
        setRoom(roomID);
        socket.emit("joinRoom", roomID);
        console.log("Room created: ", roomID);
        setRoomIdInput("");
      } else {
        console.error("Socket not initialized");
      }
    } catch (error) {
      console.error("Error creating room: ", error);
    }
  };

  const joinRoom = () => {
    if (roomIdInput) {
      setRoom(roomIdInput);
      socket!.emit("joinRoom", roomIdInput);
      setRoomIdInput("");
    }
  };

  const toggleTimer = () => {
    socket!.emit("toggleTimer", room);
  };

  const resetTimer = () => {
    socket!.emit("resetTimer", room);
  };

  if (!room) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100">
        <div className="p-6 bg-white rounded shadow-md">
          <h1 className="text-2xl font-bold mb-4 text-black">
            Decentralized Timer App
          </h1>
          <button
            onClick={createRoom}
            className="w-full bg-blue-500 text-white p-2 rounded mb-2 hover:bg-blue-600"
          >
            Create Room
          </button>
          <div className="flex">
            <input
              type="text"
              value={roomIdInput}
              onChange={(e) => setRoomIdInput(e.target.value)}
              placeholder="Room ID"
              className="flex-grow p-2 border rounded-l text-black"
            />
            <button
              onClick={joinRoom}
              className="bg-green-500 text-white p-2 rounded-r hover:bg-green-600"
            >
              Join Room
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-black">
      <div className="p-6 bg-white text-black rounded shadow-md">
        <h1 className="text-2xl font-bold mb-4">Room: {room}</h1>
        <h2 className="text-4xl font-bold mb-4">Timer: {timer}</h2>
        <h3 className="text-lg mb-4">Run Count: {runCount}/10</h3>
        <div className="flex justify-between">
          <button
            onClick={toggleTimer}
            className={`px-4 py-2 rounded ${timerRunning ? "bg-yellow-500 hover:bg-yellow-600" : "bg-green-500 hover:bg-green-600"} text-white`}
          >
            {timerRunning ? "Pause" : "Start"}
          </button>
          <button
            onClick={resetTimer}
            className="px-4 py-2 rounded bg-red-500 hover:bg-red-600 text-white"
          >
            Reset
          </button>
        </div>
      </div>
    </div>
  );
}
