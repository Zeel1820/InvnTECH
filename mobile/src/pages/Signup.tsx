'use client';

import { useState } from 'react';
import { View, Text, TextInput, Pressable, StyleSheet } from 'react-native';
import { useNavigate } from 'react-router-native';

export default function Signup() {
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [role, setRole] = useState('staff'); // default
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false); // toggle

  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const navigate = useNavigate();

  // Email validation
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  // Password validation: 1 uppercase, 1 number, min 8 chars
  const passwordRegex = /^(?=.*[A-Z])(?=.*\d).{8,}$/;

  async function handleSubmit() {
    setError('');
    setSuccess('');

    if (!emailRegex.test(email)) {
      setError('Please enter a valid email address.');
      return;
    }

    if (!passwordRegex.test(password)) {
      setError(
        'Password must contain at least 1 uppercase letter, 1 number, and be at least 8 characters long.',
      );
      return;
    }

    // Split full name
    const [firstName, ...rest] = fullName.trim().split(' ');
    const lastName = rest.join(' ');

    try {
      const res = await fetch('http://localhost:3000/api/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ firstName, lastName, email, password, role }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.message || 'Signup failed');
        return;
      }

      setSuccess('Account created successfully! Redirecting...');
      setTimeout(() => navigate('/login'), 1500);
    } catch (e) {
      setError('Something went wrong');
    }
  }

  return (
    <View style={styles.container}>
      <View style={styles.card}>
        {/* Heading */}
        <Text style={styles.title}>Create a new account</Text>
        <Text style={styles.subtitle}>Enter your details to register.</Text>

        {/* Error / Success */}
        {error && <Text style={styles.errorText}>{error}</Text>}
        {success && <Text style={styles.successText}>{success}</Text>}

        <View style={styles.form}>
          {/* Full Name */}
          <View>
            <Text style={styles.label}>Full Name *</Text>
            <TextInput
              style={styles.input}
              placeholder="James Brown"
              value={fullName}
              onChangeText={setFullName}
              autoCapitalize="words"
            />
          </View>

          {/* Email */}
          <View>
            <Text style={styles.label}>Email Address *</Text>
            <TextInput
              style={styles.input}
              placeholder="hello@company.com"
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
            />
            {email && !emailRegex.test(email) && (
              <Text style={styles.errorTextSmall}>Invalid email format.</Text>
            )}
          </View>

          {/* Role Select - Simplified for mobile */}
          <View>
            <Text style={styles.label}>Select Role *</Text>
            {/* Replace with a proper picker component in a real app */}
            <View style={styles.roleContainer}>
              {['admin', 'manager', 'staff'].map((r) => (
                <Pressable
                  key={r}
                  style={[styles.roleButton, role === r && styles.roleButtonSelected]}
                  onPress={() => setRole(r)}
                >
                  <Text
                    style={[styles.roleButtonText, role === r && styles.roleButtonTextSelected]}
                  >
                    {r.charAt(0).toUpperCase() + r.slice(1)}
                  </Text>
                </Pressable>
              ))}
            </View>
          </View>

          {/* Password */}
          <View>
            <Text style={styles.label}>Password *</Text>
            <View style={styles.passwordInputContainer}>
              <TextInput
                style={styles.passwordInput}
                placeholder="••••••••"
                secureTextEntry={!showPassword}
                value={password}
                onChangeText={setPassword}
              />
              <Pressable onPress={() => setShowPassword(!showPassword)} style={styles.eyeIcon}>
                {/* Replace with an actual icon */}
                <Text>{showPassword ? 'Hide' : 'Show'}</Text>
              </Pressable>
            </View>
            {password && !passwordRegex.test(password) && (
              <Text style={styles.errorTextSmall}>
                Must have 1 uppercase, 1 number, min. 8 characters.
              </Text>
            )}
            {password && passwordRegex.test(password) && (
              <Text style={styles.successTextSmall}>Strong password ✓</Text>
            )}
          </View>

          {/* Register Button */}
          <Pressable style={styles.button} onPress={handleSubmit}>
            <Text style={styles.buttonText}>Register</Text>
          </Pressable>

          {/* Terms */}
          <Text style={styles.termsText}>
            By clicking Register, you agree to our <Text style={styles.link}>Terms and Conditions</Text>.
          </Text>
        </View>

        {/* Already have account */}
        <Text style={styles.footerText}>
          Already have an account?{' '}
          <Text onPress={() => navigate('/login')} style={styles.link}>
            Login here
          </Text>
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#f9fafb' },
  card: {
    backgroundColor: 'white',
    borderRadius: 8,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 1.41,
    elevation: 2,
    width: '90%',
    maxWidth: 400,
  },
  title: { fontSize: 24, fontWeight: 'bold', textAlign: 'center', marginBottom: 8 },
  subtitle: { color: '#6b7280', textAlign: 'center', marginBottom: 16 },
  errorText: { color: '#ef4444', textAlign: 'center', fontSize: 14, marginBottom: 8 },
  successText: { color: '#22c55e', textAlign: 'center', fontSize: 14, marginBottom: 8 },
  form: { gap: 16 },
  label: { fontSize: 14, fontWeight: '500', color: '#374151', marginBottom: 8 },
  input: {
    borderRadius: 6,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: '#d1d5db',
  },
  passwordInputContainer: { flexDirection: 'row', alignItems: 'center' },
  passwordInput: { flex: 1, borderRightWidth: 0, borderTopRightRadius: 0, borderBottomRightRadius: 0 },
  eyeIcon: {
    padding: 10,
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderLeftWidth: 0,
    borderTopRightRadius: 6,
    borderBottomRightRadius: 6,
  },
  errorTextSmall: { color: '#ef4444', fontSize: 12, marginTop: 4 },
  successTextSmall: { color: '#22c55e', fontSize: 12, marginTop: 4 },
  roleContainer: { flexDirection: 'row', justifyContent: 'space-around' },
  roleButton: {
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#d1d5db',
  },
  roleButtonSelected: { backgroundColor: '#4f46e5', borderColor: '#4f46e5' },
  roleButtonText: { color: '#374151' },
  roleButtonTextSelected: { color: 'white' },
  button: {
    backgroundColor: '#4f46e5',
    borderRadius: 6,
    paddingVertical: 12,
    alignItems: 'center',
    marginTop: 8,
  },
  buttonText: { color: 'white', fontWeight: '500', fontSize: 16 },
  termsText: { color: '#6b7280', fontSize: 12, textAlign: 'center', marginTop: 8 },
  link: { color: '#4f46e5', textDecorationLine: 'underline' },
  footerText: { textAlign: 'center', marginTop: 16, fontSize: 14 },
});
