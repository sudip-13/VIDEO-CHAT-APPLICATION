"use client";
import { useState, useEffect, useCallback } from "react";
import { useSocket } from "@/components/providers/socket";
import { usePeer } from "@/components/providers/peer";

export default function Meetings() {
  const socket = useSocket();
  const { createAnswer, createOffer, setRemoteAns, peer,updateUser,joinedUsers } = usePeer();

  const handleUserjoined = useCallback(
    async ({ email, name, roomId }) => {
      console.log("New user joined " + email);
      const offer = await createOffer();
      socket.emit("call-user", {
        name: name,
        roomId: roomId,
        email: email,
        offer: offer,
      });
      updateUser(name,email);
    },
    [createOffer, socket]
  );

  const handleAcceptingCall = useCallback(
    async ({ ans }) => {
      try {
        console.log("Accepting call from ", ans);
        await setRemoteAns(ans);
      } catch (error) {
        console.error("Error handling incoming call:", error);
      }
    },
    [setRemoteAns]
  );
  const handleNegotiation = useCallback(() => {
    const localoffer = peer.localDescription;
    socket.emit("call-accept", { email: joinedUsers ,ans: localoffer });
  }, [peer.localDescription, socket]);

  useEffect(() => {
    socket.on("user-joined", handleUserjoined);
    socket.on("call-accept", handleAcceptingCall);

    return () => {
      socket.off("user-joined", handleUserjoined);
      socket.off("call-accept", handleAcceptingCall);
    };
  }, [socket, handleUserjoined, handleAcceptingCall]);

  useEffect(() => {
    peer.addEventListener("negotiationneeded", handleNegotiation);
    return () => {
      peer.removeEventListener("negotiationneeded", handleNegotiation);
    };
  }, [handleNegotiation]);
  return (
    <>
      <div className="text-white">Joined users: {joinedUsers.join(", ")}</div>
      
    </>
  );
}
