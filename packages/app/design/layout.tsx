import {
  Pressable as RNPressable,
  TextInput as RNTextInput,
  View as RNView,
} from "react-native";
import { styled } from "nativewind";

export const Row = styled(RNView, "flex-row");
export const View = styled(RNView, "");
export const Pressable = styled(RNPressable, "");
export const TextInput = styled(RNTextInput, "");
