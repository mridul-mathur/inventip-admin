"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Trash, Plus } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface Tag {
  _id: string;
  tag: string;
}

export default function TagsPage() {
  const { toast } = useToast();
  const [tags, setTags] = useState<Tag[]>([]);
  const [newTag, setNewTag] = useState("");
  const [loading, setLoading] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);

  useEffect(() => {
    const fetchTags = async () => {
      try {
        const response = await fetch("/api/getdata/tags");
        if (!response.ok) throw new Error("Failed to fetch tags");
        const data = await response.json();
        setTags(data.data);
      } catch (error) {
        console.error(error);
      }
    };
    fetchTags();
  }, []);

  const handleAddTag = async () => {
    if (!newTag.trim()) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Tag name is required!",
      });
      return;
    }

    try {
      setLoading(true);
      const formData = new FormData();
      formData.append("tag", newTag.trim().toLowerCase());

      const response = await fetch("/api/tags", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        const result = await response.json();
        throw new Error(result.error || "Failed to add tag");
      }

      const result = await response.json();
      setTags([...tags, result.tag]);
      toast({ title: "Success", description: "Tag added successfully!" });

      setNewTag("");
      setModalOpen(false);
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description:
          error instanceof Error ? error.message : "An error occurred",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteTag = async (tagId: string) => {
    try {
      setLoading(true);
      const response = await fetch(`/api/tags?id=${tagId}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const result = await response.json();
        throw new Error(result.error || "Failed to delete tag");
      }

      setTags(tags.filter((tag) => tag._id !== tagId));
      toast({ title: "Success", description: "Tag deleted successfully!" });
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description:
          error instanceof Error ? error.message : "An error occurred",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Manage Tags</h1>
        <Dialog open={modalOpen} onOpenChange={setModalOpen}>
          <DialogTrigger asChild>
            <Button variant="outline">
              <Plus className="mr-2 h-4 w-4" />
              Add Tag
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[400px]">
            <DialogTitle>Add a New Tag</DialogTitle>
            <Input
              placeholder="Enter tag name"
              value={newTag}
              onChange={(e) => setNewTag(e.target.value)}
              className="mt-2"
            />
            <DialogFooter>
              <Button onClick={handleAddTag} disabled={loading}>
                {loading ? "Adding..." : "Add Tag"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {tags.map((tag) => (
          <Card key={tag._id} className="p-4 flex justify-between items-center">
            <span className="text-sm font-medium">{tag.tag}</span>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => handleDeleteTag(tag._id)}
              disabled={loading}
            >
              <Trash className="h-4 w-4 text-red-500" />
            </Button>
          </Card>
        ))}
      </div>
    </div>
  );
}
