'use client';

import { useAuth } from "../hooks/useAuth";
import { Button } from "../components/ui/button";
import { Link } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";

export default function Dashboard() {
  const { user, logout } = useAuth();

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-center">Dashboard</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="text-center">
            <p className="text-lg">Welcome, {user?.firstName}!</p>
            <p className="text-sm text-muted-foreground">You are logged in as a {user?.role}.</p>
          </div>
          <nav className="flex flex-col space-y-2">
            <Link href="/profile">
              <Button variant="outline" className="w-full">View Profile</Button>
            </Link>
            {user?.role === 'admin' && (
              <Link href="/admin">
                <Button variant="outline" className="w-full">Admin Dashboard</Button>
              </Link>
            )}
            {user?.role === 'manager' && (
              <Link href="/manager">
                <Button variant="outline" className="w-full">Manager Dashboard</Button>
              </Link>
            )}
            {user?.role === 'staff' && (
              <Link href="/staff">
                <Button variant="outline" className="w-full">Staff Dashboard</Button>
              </Link>
            )}
          </nav>
          <Button onClick={() => logout()} className="w-full">Logout</Button>
        </CardContent>
      </Card>
    </div>
  );
}
