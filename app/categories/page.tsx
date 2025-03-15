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

interface Category {
  _id: string;
  category: string;
}

export default function CategoriesPage() {
  const { toast } = useToast();
  const [categories, setCategories] = useState<Category[]>([]);
  const [newCategory, setNewCategory] = useState("");
  const [loading, setLoading] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const response = await fetch("/api/getdata/categories");
        if (!response.ok) throw new Error("Failed to fetch categories");
        const data = await response.json();
        setCategories(data.data);
      } catch (error) {
        console.error(error);
      }
    };
    fetchCategories();
  }, []);

  const handleAddCategory = async () => {
    if (!newCategory.trim()) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Category name is required!",
      });
      return;
    }

    try {
      setLoading(true);
      const formData = new FormData();
      formData.append("category", newCategory.trim().toLowerCase());

      const response = await fetch("/api/categories", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        const result = await response.json();
        throw new Error(result.error || "Failed to add category");
      }

      const result = await response.json();
      setCategories([...categories, result.category]);
      toast({ title: "Success", description: "Category added successfully!" });

      setNewCategory("");
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

  const handleDeleteCategory = async (categoryId: string) => {
    try {
      setLoading(true);
      const response = await fetch(`/api/categories?id=${categoryId}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const result = await response.json();
        throw new Error(result.error || "Failed to delete category");
      }

      setCategories(
        categories.filter((category) => category._id !== categoryId)
      );
      toast({
        title: "Success",
        description: "Category deleted successfully!",
      });
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
        <h1 className="text-2xl font-bold">Manage Categories</h1>
        <Dialog open={modalOpen} onOpenChange={setModalOpen}>
          <DialogTrigger asChild>
            <Button variant="outline">
              <Plus className="mr-2 h-4 w-4" />
              Add Category
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[400px]">
            <DialogTitle>Add a New Category</DialogTitle>
            <Input
              placeholder="Enter Category name"
              value={newCategory}
              onChange={(e) => setNewCategory(e.target.value)}
              className="mt-2"
            />
            <DialogFooter>
              <Button onClick={handleAddCategory} disabled={loading}>
                {loading ? "Adding..." : "Add Category"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {categories.map((category) => (
          <Card
            key={category._id}
            className="p-4 flex justify-between items-center"
          >
            <span className="text-sm font-medium">{category.category}</span>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => handleDeleteCategory(category._id)}
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
