// src/components/common/MekoLogo.tsx

import { Image, StyleSheet, View } from "react-native";

import COLORS from "../../constants/colors";

type Props = {
  size?: number;
};

export default function MekoLogo({ size = 44 }: Props) {
  const containerRadius = size * (13 / 44);
  const logoSize = size * (42 / 44);

  return (
    <View
      style={[
        styles.container,
        {
          width: size,
          height: size,
          borderRadius: containerRadius,
        },
      ]}
    >
      <Image
        source={require("../../../assets/images/meko-logo-dark-rmbg.png")}
        style={{
          width: logoSize,
          height: logoSize,
        }}
        resizeMode="contain"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: COLORS.primary,

    alignItems: "center",
    justifyContent: "center",

    shadowColor: COLORS.primary,
    shadowOffset: {
      width: 0,
      height: 3,
    },
    shadowOpacity: 0.18,
    shadowRadius: 6,
    elevation: 4,
  },
});
