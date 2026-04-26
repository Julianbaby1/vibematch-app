"use client";

import { useState } from "react";

export default function ProfilePage() {
  const [form, setForm] = useState({ name: "", age: "", bio: "", location: "", photo: "" });

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    alert("Profile saved (hook to Supabase next)");
  };

  return (
    <div style={{ padding: 20 }}>
      <h1>Create Profile</h1>
      <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        <input name="name" placeholder="Name" onChange={handleChange} />
        <input name="age" placeholder="Age" onChange={handleChange} />
        <input name="location" placeholder="City" onChange={handleChange} />
        <input name="photo" placeholder="Photo URL" onChange={handleChange} />
        <textarea name="bio" placeholder="Bio" onChange={handleChange} />
        <button type="submit">Save Profile</button>
      </form>
    </div>
  );
}
