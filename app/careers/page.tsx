"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Plus, Trash } from "lucide-react";
import useFetch from "@/hooks/useFetch";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  CardFooter,
} from "@/components/ui/card";
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";

interface Career {
  _id: string;
  position: string;
  location: string;
  duration: string;
  pay: string;
  job_desc: string;
  skills: string[];
}

export default function CareersPage() {
  const { data, error, loading } = useFetch<{ careers: Career[] }>("/api");
  const [careers, setCareers] = useState<Career[]>([]);

  useEffect(() => {
    if (data?.careers) {
      setCareers(data.careers);
    }
  }, [data]);

  const handleDelete = async (id: string) => {
    try {
      const res = await fetch(`/api/careers?id=${id}`, { method: "DELETE" });

      if (!res.ok) {
        throw new Error("Failed to delete career");
      }

      setCareers((prevCareers) =>
        prevCareers.filter((career) => career._id !== id)
      );
    } catch (error) {
      console.error("Error deleting career:", error);
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <p>Loading...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto p-6">
        <p className="text-red-500">Error fetching careers: {error.message}</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Careers</h1>
        <Link href="/careers/add">
          <Button className="font-bold" size="default">
            <Plus />
            Add Opening
          </Button>
        </Link>
      </div>
      {careers.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {careers.map((career, index) => (
            <CareerCard
              key={index} // Using index as the key
              _id={career._id}
              position={career.position}
              location={career.location}
              duration={career.duration}
              pay={career.pay}
              skills={career.skills}
              onDelete={handleDelete}
            />
          ))}
        </div>
      ) : (
        <p>No careers available.</p>
      )}
    </div>
  );
}

function CareerCard({
  _id,
  position,
  location,
  duration,
  pay,
  skills,
  onDelete,
}: {
  _id: string;
  position: string;
  location: string;
  duration: string;
  pay: string;
  skills: string[];
  onDelete: (id: string) => void;
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{position || "No Position"}</CardTitle>
      </CardHeader>
      <CardContent>
        <p>
          <strong>Location:</strong> {location || "N/A"}
        </p>
        <p>
          <strong>Duration:</strong> {duration || "N/A"}
        </p>
        <p>
          <strong>Pay:</strong> {pay || "N/A"}
        </p>
        <p>
          <strong>Skills:</strong> {skills.length ? skills.join(", ") : "N/A"}
        </p>
      </CardContent>
      <CardFooter>
        <div className="flex justify-end space-x-2">
          <Dialog>
            <DialogTrigger asChild>
              <Button size="icon" variant="ghost">
                <Trash color="red" />
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogTitle>Confirm Delete</DialogTitle>
              <DialogDescription>
                {`Are you sure you want to delete the position "${position}"?`}
              </DialogDescription>
              <div className="flex justify-end space-x-4 mt-4">
                <DialogTrigger asChild>
                  <Button variant="ghost">Cancel</Button>
                </DialogTrigger>
                <DialogTrigger asChild>
                  <Button variant="destructive" onClick={() => onDelete(_id)}>
                    Delete
                  </Button>
                </DialogTrigger>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </CardFooter>
    </Card>
  );
}
