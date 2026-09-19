import React from 'react';
import { View, TextInput, Text, StyleSheet, ViewStyle, TextStyle } from 'react-native';
import { useTheme } from '../theme';

interface XInputProps {
  label?: string;
  placeholder?: string;
  value: string;
  onChangeText: (text: string) => void;
  secureTextEntry?: boolean;
  keyboardType?: 'default' | 'email-address' | 'numeric' | 'phone-pad';
  error?: string;
  style?: ViewStyle;
  inputStyle?: TextStyle;
  icon?: React.ReactNode;
}

export const XInput: React.FC<XInputProps> = ({
  label,
  placeholder,
  value,
  onChangeText,
  secureTextEntry = false,
  keyboardType = 'default',
  error,
  style,
  inputStyle,
  icon,
}) => {
  const { colors, typography, spacing, radius } = useTheme();

  return (
    <View style={style}>
      {label && (
        <Text style={[typography.label, { color: colors.textSecondary, marginBottom: spacing.sm }]}>
          {label}
        </Text>
      )}
      <View
        style={[
          styles.container,
          {
            backgroundColor: colors.surface,
            borderRadius: radius.lg,
            borderColor: error ? colors.danger : colors.border,
            borderWidth: 1.5,
          },
        ]}
      >
        {icon && <View style={styles.icon}>{icon}</View>}
        <TextInput
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor={colors.textTertiary}
          secureTextEntry={secureTextEntry}
          keyboardType={keyboardType}
          style={[
            typography.body,
            { color: colors.text, flex: 1, paddingVertical: spacing.md },
            inputStyle,
          ]}
        />
      </View>
      {error && (
        <Text style={[typography.bodySmall, { color: colors.danger, marginTop: spacing.sm }]}>
          {error}
        </Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    minHeight: 48,
  },
  icon: {
    marginRight: 8,
  },
});
