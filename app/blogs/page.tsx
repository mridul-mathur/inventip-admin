"use client";

import React, { useEffect, useState } from "react";
import { Button } from "../../components/ui/button";
import { Card } from "../../components/ui/card";
import { Plus, Trash, Pencil } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
  DialogTrigger,
} from "../../components/ui/dialog";
import Link from "next/link";
import useFetch from "@/hooks/useFetch";

interface Segments {
  head: string;
  subhead: string;
  content: string;
  seg_img: string;
}
interface Blog {
  _id: string;
  title: string;
  title_image: string;
  segment: [Segments];
}

const BlogCard = ({
  _id,
  title,
  image,
  onDelete,
}: {
  _id: string;
  title: string;
  image: string;
  onDelete: (id: string) => void;
}) => {
  return (
    <Card className="p-4 w-full space-y-4">
      <img
        src={image === "" ? "https://via.placeholder.com/200" : image}
        alt={title}
        className="w-full h-40 object-cover rounded-md"
      />
      <div className="flex space-x-4 items-start justify-between">
        <h3 className="font-semibold text-xl">{title}</h3>
        <div className="flex space-x-2">
          <Link href={`/blogs/edit/${_id}`}>
            <Button size="icon" className="font-black" variant="secondary">
              <Pencil />
            </Button>
          </Link>
          <Dialog>
            <DialogTrigger asChild>
              <Button size="icon" variant="ghost">
                <Trash color="red" />
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogTitle>Confirm Delete</DialogTitle>
              <DialogDescription>
                {`Are you sure you want to delete "${title}"?`}
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
      </div>
    </Card>
  );
};

interface Careers {
  title: string;
  content: string;
  image: string;
}

interface BlogResponse {
  _id: string;
  blogs: [Blog];
  careers: [Careers];
}

const BlogsPage = () => {
  const { data, error, loading } = useFetch<BlogResponse>("/api");
  const [blogs, setBlogs] = useState<Blog[]>([]);

  useEffect(() => {
    if (data && data.blogs) {
      setBlogs(data.blogs);
    }
  }, [data]);

  const handleDelete = async (_id: string) => {
    try {
      const response = await fetch(`/api/blogs/delete?id=${_id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error("Failed to delete blog.");
      }

      setBlogs((prevBlogs) => prevBlogs.filter((blog) => blog._id !== _id));
    } catch (error) {
      console.error("Error deleting blog:", error);
      console.log("Failed to delete the blog. Please try again.");
    }
  };

  return (
    <div className="p-6 w-full">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Manage Blogs</h1>
        <Link href="/blogs/add">
          <Button className="font-bold" size="default">
            <Plus />
            Add Blog
          </Button>
        </Link>
      </div>
      {loading ? (
        <p className="text-center">Loading blogs...</p>
      ) : error ? (
        <p className="text-center text-red-500">
          Failed to load blogs: {error.message}
        </p>
      ) : blogs.length === 0 ? (
        <p className="text-center">No blogs available. Add one now!</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {blogs.map((blog, index: number) => (
            <div key={index}>
              <BlogCard
                key={index}
                _id={blog._id}
                title={blog.title}
                image={blog.title_image}
                onDelete={handleDelete}
              />
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default BlogsPage;
