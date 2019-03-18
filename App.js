import React, { Component } from "react";
import { NodeCameraView } from "react-native-nodemediaclient";
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  Dimensions,
  PermissionsAndroid,
  Platform
} from "react-native";
import Video from "react-native-video";

const deviceWidth = Dimensions.get("window").width;

const settings = {
  camera: { cameraId: 1, cameraFrontMirror: true },
  audio: { bitrate: 32000, profile: 1, samplerate: 44100 },
  video: {
    preset: 24,
    bitrate: 400000,
    profile: 2,
    fps: 30,
    videoFrontMirror: true
  }
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#000",
    justifyContent: "center"
  },
  nodePlayerView: {
    position: "absolute",
    top: 0,
    bottom: 0,
    left: 0,
    right: 0
  },
  nodeCameraView: {
    position: "absolute",
    top: 0,
    bottom: 0,
    left: 0,
    right: 0
  },
  playBtn: {
    justifyContent: "center",
    alignItems: "center",
    alignSelf: "center",
    backgroundColor: "#333",
    borderColor: "#333",
    borderWidth: 3,
    borderRadius: 2,
    height: 50,
    width: deviceWidth / 2,
    paddingVertical: 10,
    paddingHorizontal: 30,
    elevation: 4,
    marginVertical: 10
  },
  playBtnContainer: {
    position: "absolute",
    bottom: 100,
    left: 0,
    right: 0,
    marginVertical: 20
  },
  goLive: {
    justifyContent: "center",
    alignItems: "center",
    alignSelf: "center",
    backgroundColor: "#d1a667",
    borderColor: "#d1a667",
    borderWidth: 3,
    borderRadius: 2,
    height: 50,
    width: deviceWidth / 2,
    paddingVertical: 10,
    paddingHorizontal: 30,
    elevation: 4,
    marginVertical: 10
  },
  adminBtnContainer: {
    position: "absolute",
    top: 0,
    right: 0,
    margin: 30,
    marginTop: 60
  },
  adminBtn: {
    backgroundColor: "#006D9E",
    padding: 10,
    justifyContent: "center",
    alignItems: "center",
    borderRadius: 5,
    elevation: 4
  },
  btnText: { color: "#FFF", fontSize: 18 }
});

export default class App extends Component {
  state = {
    admin: false,
    isPublishing: false,
    userComment: "",
    hasPermission: false,
    paused: true
  };

  onPressAdminBtn = async () => {
    const { admin: adminState, hasPermission } = this.state;
    this.setState({ admin: !adminState });
    if (!adminState) {
      if (Platform.OS === "android") {
        if (!hasPermission) {
          await this.checkPermissions();
        }
      }
    }
  };

  onPressPlayBtn = () => {
    const { paused: pausedState } = this.state;
    this.setState({ paused: !pausedState });
  };

  renderPlayerView = () => {
    const { paused } = this.state;
    const source = {
      uri: "https://stream.mux.com/PLAYBACK_ID_HERE.m3u8"
    };
    return (
      <Video
        source={source} // Can be a URL or a local file.
        /* eslint-disable */
        ref={ref => {
          this.player = ref;
        }} // Store reference
        /* eslint-enable */
        onBuffer={this.onBuffer} // Callback when remote video is buffering
        onError={this.onError} // Callback when video cannot be loaded
        style={styles.nodePlayerView}
        fullscreen={false}
        resizeMode="cover"
        paused={paused}
      />
    );
  };

  onBuffer = buffer => {
    console.log("onBuffer: ", buffer);
  };

  onError = error => {
    console.log("onError: ", error);
  };

  renderCameraView = () => {
    const { hasPermission } = this.state;
    if (Platform.OS === "android" && !hasPermission) {
      return <View />;
    }

    return (
      <NodeCameraView
        style={styles.nodeCameraView}
        /* eslint-disable */
        ref={vb => {
          this.vb = vb;
        }}
        /* eslint-enable */
        outputUrl="rtmp://live.mux.com/app/STREAM-KEY-HERE"
        camera={settings.camera}
        audio={settings.audio}
        video={settings.video}
        autopreview
      />
    );
  };

  checkPermissions = async () => {
    console.log("Checking Permissions Android");
    try {
      const granted = await PermissionsAndroid.requestMultiple([
        PermissionsAndroid.PERMISSIONS.CAMERA,
        PermissionsAndroid.PERMISSIONS.RECORD_AUDIO,
        PermissionsAndroid.PERMISSIONS.WRITE_EXTERNAL_STORAGE
      ]);
      let hasAllPermissions = true;
      Object.keys(granted).forEach(key => {
        // key: the name of the object key
        // index: the ordinal position of the key within the object
        if (granted[key] !== "granted") {
          console.log("Does not have permission for: ", granted[key]);
          hasAllPermissions = false;
        }
      });
      console.log("hasAllPermissions: ", hasAllPermissions);
      this.setState({ hasPermission: hasAllPermissions });
    } catch (err) {
      console.warn(err);
    }
  };

  onPressPublishBtn = async () => {
    const { isPublishing: publishingState, hasPermission } = this.state;
    if (Platform.OS === "android") {
      if (!hasPermission) {
        this.checkPermissions();
        return;
      }
    }

    if (publishingState) {
      this.vb.stop();
    } else {
      this.vb.start();
    }

    this.setState({ isPublishing: !publishingState });
  };

  render() {
    const { admin, paused, isPublishing } = this.state;
    return (
      <View style={styles.container}>
        {admin ? this.renderCameraView() : this.renderPlayerView()}

        {admin ? (
          <TouchableOpacity onPress={this.onPressPublishBtn}>
            <View style={styles.goLive}>
              <Text style={styles.btnText}>
                {isPublishing ? "END LIVE" : "GO LIVE"}
              </Text>
            </View>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity
            style={styles.playBtnContainer}
            onPress={this.onPressPlayBtn}
          >
            <View style={styles.playBtn}>
              <Text style={styles.btnText}>{paused ? "PLAY" : "PAUSE"}</Text>
            </View>
          </TouchableOpacity>
        )}

        <TouchableOpacity
          style={styles.adminBtnContainer}
          onPress={this.onPressAdminBtn}
        >
          <View style={styles.adminBtn}>
            <Text style={styles.btnText}>
              {admin ? "VIEW USER" : "VIEW ADMIN"}
            </Text>
          </View>
        </TouchableOpacity>
      </View>
    );
  }
}
