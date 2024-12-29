"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";

interface CareerForm {
  position: string;
  location: string;
  duration: string;
  pay: string;
  job_desc: string;
  skills: string;
}

export default function AddCareerPage() {
  const [form, setForm] = useState<CareerForm>({
    position: "",
    location: "",
    duration: "",
    pay: "",
    job_desc: "",
    skills: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ): void => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent): Promise<void> => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const skillsArray = form.skills.split(",").map((skill) => skill.trim());

    try {
      const res = await fetch("/api/careers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, skills: skillsArray }),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || "Failed to add career");
      }

      router.push("/careers");
    } catch (err: any) {
      console.error("Error submitting form:", err);
      setError(err.message || "An unexpected error occurred");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6">Add Career</h1>
      <form onSubmit={handleSubmit} className="space-y-4">
        <Input
          name="position"
          placeholder="Position"
          value={form.position}
          onChange={handleChange}
          required
        />
        <Input
          name="location"
          placeholder="Location"
          value={form.location}
          onChange={handleChange}
          required
        />
        <Input
          name="duration"
          placeholder="Duration"
          value={form.duration}
          onChange={handleChange}
          required
        />
        <Input
          name="pay"
          placeholder="Pay"
          value={form.pay}
          onChange={handleChange}
          required
        />
        <Textarea
          name="job_desc"
          placeholder="Job Description"
          value={form.job_desc}
          onChange={handleChange}
          required
        />
        <Input
          name="skills"
          placeholder="Skills (comma-separated)"
          value={form.skills}
          onChange={handleChange}
          required
        />
        <div className="space-y-2">
          {error && <p className="text-red-500">{error}</p>}
          <Button type="submit" disabled={loading}>
            {loading ? "Adding..." : "Add Career"}
          </Button>
        </div>
      </form>
    </div>
  );
}
