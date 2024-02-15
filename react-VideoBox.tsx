import React, { useState, useContext, useEffect } from "react";
import "./index.css";
import AgoraRTC, { StreamSpec } from "agora-rtc-sdk";
import VideoBoxControls from "../VideoBoxControls";
import {
  AgoraRTCContext,
  SSEContext,
  AgoraRTMContext,
  WidgetControlContext,
} from "../../contexts";
import Chat from "../Chat";
import { saveSettingsToSessionStorage } from "../../lib/helpers/sessionStorageManagement";
import Coupon from "../Coupon";
import Product from "../Product";

interface IVideoBoxProps {
  endCall: () => void;
}

export interface MessageObject {
  user: string;
  content: string;
  type: "promo" | "message" | "product";
}

function VideoBox({ endCall }: IVideoBoxProps) {
  const {
    rtcRemoteStream,
    rtcLocalStream,
    rtcClient,
    setRtcLocalStream,
  } = useContext(AgoraRTCContext);
  const { agoraAppId, agoraChannelKey, sessionId } = useContext(SSEContext);
  const { rtmChannel } = useContext(AgoraRTMContext);

  const {
    videoOff,
    setVideoOff,
    micOff,
    setMicOff,
    muteRemoteVideo,
  } = useContext(WidgetControlContext);

  const [showChat, setShowChat] = useState<boolean>(false);
  const [message, setMessage] = useState<string>("");
  const [chat, setChat] = useState<MessageObject[]>([]);

  const [showCoupon, sethSowCoupon] = useState<boolean>(false);
  const [couponCode, setCouponCode] = useState<string>("");

  const [showProduct, setShowProduct] = useState<any>(false);
  const [productTitle, setProductTitle] = useState<string>("");
  const [productUrl, setProductUrl] = useState<string>("");
  const [productImageUrl, setProductImageUrl] = useState<string>("");
  const [productSKU, setProductSKU] = useState<string>("");

  function handleFail(err: string) {
    console.log("Error has been occured:", err);
  }

  async function micOffSetter(): Promise<void> {
    micOff ? rtcLocalStream.unmuteAudio() : rtcLocalStream.muteAudio();
    setMicOff(!micOff);
  }

  async function videoOffSetter(): Promise<void> {
    videoOff ? rtcLocalStream.unmuteVideo() : rtcLocalStream.muteVideo();
    setVideoOff(!videoOff);
  }

  async function initiateLocalStream(): Promise<void> {
    const streamSpec: StreamSpec = {
      streamID: sessionId,
      audio: true,
      video: true,
      screen: false,
      mirror: true,
    };
    const createdStream = await AgoraRTC.createStream(streamSpec);
    setRtcLocalStream(createdStream);

    createdStream.init(
      () => {
        createdStream.play("caller", { fit: "cover" });

        videoOff ? createdStream.muteVideo() : createdStream.unmuteVideo();
        micOff ? createdStream.muteAudio() : createdStream.unmuteAudio();

        createdStream.setAudioProfile('high_quality');
        createdStream.setVideoProfile('720p_6');
        rtcClient.publish(createdStream, handleFail);
      },
      (err) => {
        if (err.msg) handleFail(err.msg);
      }
    );
  }

  useEffect(() => {
    rtcRemoteStream.stop();
    rtcRemoteStream.play("receiver", { fit: "cover" });
    rtcRemoteStream.unmuteAudio();
    initiateLocalStream();
    saveSettingsToSessionStorage(agoraAppId, agoraChannelKey); // after call acceptance storing settings to session.

    rtmChannel
      .join()
      .then(() => {
        subscribeRTMChannelEvents();
      })
      .catch((error: any) => {});
  }, []);

  function subscribeRTMChannelEvents(): void {
    rtmChannel.on("ChannelMessage", ({ text }: any, senderId: any) => {
      const [action, originalMessage] = text.split("*:::");
      if (!originalMessage) return;
      switch (action) {
        case "promo":
          setShowProduct(false);
          sethSowCoupon(true);
          setCouponCode(originalMessage);
          setChat((oldState: any) => {
            return [
              ...oldState,
              { user: senderId, content: originalMessage, type: action },
            ];
          });
          break;
        case "product":
          sethSowCoupon(false);
          setShowProduct(true);
          const parsedData = JSON.parse(originalMessage);
          if (parsedData) {
            setProductTitle(parsedData.title);
            setProductUrl(parsedData.url);
            setProductImageUrl(parsedData.image);
          }

          setChat((oldState: any) => {
            return [
              ...oldState,
              {
                user: senderId,
                content: window.location.origin + parsedData.url,
                type: action,
              },
            ];
          });
          break;
        case "message":
          setChat((oldState: any) => {
            return [
              ...oldState,
              { user: senderId, content: originalMessage, type: action },
            ];
          });
          break;
        default:
          break;
      }
    });
  }

  function sendMessage() {
    if (message === "") return;
    rtmChannel
      .sendMessage(
        { text: "custom*:::" + message },
        { enableHistoricalMessaging: true }
      )
      .then(() => {});
    setChat((oldState: any) => {
      return [...oldState, { user: "me", content: message, type: "message" }];
    });
    setMessage("");
  }

  return (
    <div>
      <div className="call-plugin-container">
        <div
          id="receiver"
          className="receiver-video receiver-video-box-transform"
        >
          {muteRemoteVideo && <p className="video-off-text">Camera is off</p>}

          <div id="caller" className="video-shopping-assistant"></div>
          {showChat && (
            <Chat
              message={message}
              setMessage={setMessage}
              chat={chat}
              sendMessage={sendMessage}
              setShowChat={setShowChat}
            />
          )}
          {!showChat && (
            <VideoBoxControls
              localStreamMuted={micOff}
              localStreamVideoOffed={videoOff}
              showChat={showChat}
              endCall={endCall}
              muteLocalStream={micOffSetter}
              videoOffLocalStream={videoOffSetter}
              setShowChat={setShowChat}
            />
          )}
          {showCoupon && (
            <Coupon hideMessage={sethSowCoupon} code={couponCode} />
          )}
          {showProduct && (
            <Product
              hideMessage={setShowProduct}
              imageUrl={productImageUrl}
              title={productTitle}
              url={productUrl}
            />
          )}
        </div>
      </div>
    </div>
  );
}

export default VideoBox;

