import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { supabase } from '@/lib/supabase';
import type { User } from '@supabase/supabase-js';
import { useNavigate } from 'react-router-dom';

// Define a type for your group data for better type safety
type Group = {
  id: string;
  name: string;
  // Add other group properties as needed
};

// Define a type for your weekly pick data
type WeeklyPick = {
  week: number;
  team_id: string;
  // Add other pick properties
};

export default function Dashboard() {
  const [user, setUser] = useState<User | null>(null);
  const [groups, setGroups] = useState<Group[]>([]);
  const [weeklyPicks, setWeeklyPicks] = useState<WeeklyPick[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate()

  useEffect(() => {
    const fetchUserData = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        setUser(session.user);
        // Fetch user's groups and picks once the user is confirmed
        // You'll need to implement these functions based on your database schema
        // const userGroups = await fetchUserGroups(session.user.id);
        // const userPicks = await fetchUserPicks(session.user.id);
        // setGroups(userGroups);
        // setWeeklyPicks(userPicks);
      }
      setLoading(false);
    };

    fetchUserData();
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate('/login')
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-800 to-gray-900">
        <p className="text-white">Loading...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-800 via-gray-900 to-black p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <header className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-white">Dashboard</h1>
            <p className="text-gray-300">Welcome back, {user?.email}</p>
          </div>
          <Button onClick={handleLogout} variant="destructive">
            Logout
          </Button>
        </header>

        <main className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column: My Groups and Create Group */}
          <div className="lg:col-span-1 space-y-8">
            <Card className="backdrop-blur-sm bg-white/10 shadow-2xl border-0 text-white">
              <CardHeader>
                <CardTitle>My Groups</CardTitle>
              </CardHeader>
              <CardContent>
                {/* Map over user's groups here */}
                <div className="space-y-4">
                  {/* Example Group Item */}
                  <div className="flex justify-between items-center p-3 bg-white/10 rounded-lg">
                    <span className="font-semibold">Sunday Football Crew</span>
                    <Button variant="outline" size="sm">View</Button>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-white/10 rounded-lg">
                    <span className="font-semibold">Office Pool</span>
                    <Button variant="outline" size="sm">View</Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="backdrop-blur-sm bg-white/10 shadow-2xl border-0 text-white">
              <CardHeader>
                <CardTitle>Join or Create a Group</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <Button className="w-full h-11 text-base font-semibold bg-green-600 hover:bg-green-700">
                  Create a New Group
                </Button>
                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <span className="w-full border-t border-gray-500" />
                  </div>
                  <div className="relative flex justify-center text-xs uppercase">
                    <span className="bg-gray-800 px-2 text-gray-400">Or</span>
                  </div>
                </div>
                <Button variant="outline" className="w-full h-11 text-base font-semibold">
                  Join with Invite Code
                </Button>
              </CardContent>
            </Card>
          </div>

          {/* Right Column: Weekly Picks */}
          <div className="lg:col-span-2">
            <Card className="backdrop-blur-sm bg-white/10 shadow-2xl border-0 text-white">
              <CardHeader>
                <CardTitle className="text-2xl">Week 1 Picks</CardTitle>
                <CardDescription className="text-gray-300">
                  Choose one team to win. You can only pick each team once per season.
                </CardDescription>
              </CardHeader>
              <CardContent>
                {/* Map over the games for the current week */}
                <div className="space-y-4">
                  {/* Example Game */}
                  <div className="p-4 bg-white/5 rounded-lg flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <Button variant="outline">Team A</Button>
                      <span className="text-gray-400">vs</span>
                      <Button variant="outline">Team B</Button>
                    </div>
                    <div className="text-sm text-gray-400">
                      SUN @ 1:00 PM
                    </div>
                  </div>
                  {/* Another Example Game */}
                  <div className="p-4 bg-white/5 rounded-lg flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <Button variant="outline">Team C</Button>
                      <span className="text-gray-400">vs</span>
                      <Button variant="outline">Team D</Button>
                    </div>
                    <div className="text-sm text-gray-400">
                      MON @ 8:15 PM
                    </div>
                  </div>
                </div>
                <div className="mt-6 text-center">
                    <Button className="w-1/2 h-11 text-base font-semibold bg-blue-600 hover:bg-blue-700">
                        Submit Pick
                    </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </main>
      </div>
    </div>
  );
}