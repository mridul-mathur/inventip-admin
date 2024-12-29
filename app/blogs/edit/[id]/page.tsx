"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { use } from "react";
import { Button } from "../../../../components/ui/button";
import { Input } from "../../../../components/ui/input";
import { Card } from "../../../../components/ui/card";
import { Textarea } from "../../../../components/ui/textarea";
import { Plus, Trash } from "lucide-react";

interface Segment {
  heading: string;
  subheading: string;
  content: string;
  imageFile: File | null;
  imagePreview: string | null;
}

interface Blog {
  id: string;
  title: string;
  titleImageFile: File | null;
  titleImagePreview: string | null;
  segments: Segment[];
}

const EditBlogPage = ({ params }: { params: Promise<{ id: string }> }) => {
  const { id } = use(params);
  const router = useRouter();

  const [blog, setBlog] = useState<Blog>({
    id: "",
    title: "",
    titleImageFile: null,
    titleImagePreview: null,
    segments: [],
  });
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    const fetchBlog = async () => {
      try {
        const response = await fetch(`/api/blogs/edit?id=${id}`);
        if (response.ok) {
          const data = await response.json();
          setBlog({
            id,
            title: data.title || "",
            titleImageFile: null,
            titleImagePreview: data.title_image || null,
            segments: data.segments.map((segment: any) => ({
              heading: segment.heading || "",
              subheading: segment.subheading || "",
              content: segment.content || "",
              imageFile: null,
              imagePreview: segment.seg_img || null,
            })),
          });
        } else {
          setErrorMessage("Failed to fetch blog data.");
        }
      } catch (error) {
        setErrorMessage("Error fetching blog data.");
        console.error("Error:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchBlog();
  }, [id]);

  const handleSegmentChange = (
    index: number,
    field: keyof Segment,
    value: string | File | null
  ) => {
    const updatedSegments = [...blog.segments];
    if (field === "imageFile" && value instanceof File) {
      updatedSegments[index].imageFile = value;
      updatedSegments[index].imagePreview = URL.createObjectURL(value);
    } else if (field !== "imageFile") {
      updatedSegments[index][field] = value as string;
    }
    setBlog({ ...blog, segments: updatedSegments });
  };

  const addSegment = () => {
    setBlog((prev) => ({
      ...prev,
      segments: [
        ...prev.segments,
        {
          heading: "",
          subheading: "",
          content: "",
          imageFile: null,
          imagePreview: null,
        },
      ],
    }));
  };

  const removeSegment = (index: number) => {
    setBlog((prev) => ({
      ...prev,
      segments: prev.segments.filter((_, i) => i !== index),
    }));
  };

  const handleUpdateBlog = async () => {
    try {
      const formData = new FormData();
      formData.append("id", blog.id);
      formData.append("title", blog.title);

      if (blog.titleImageFile) {
        formData.append("titleImage", blog.titleImageFile);
      } else if (blog.titleImagePreview) {
        formData.append("titleImageOld", blog.titleImagePreview);
      }

      blog.segments.forEach((segment, index) => {
        formData.append(`segments[${index}][heading]`, segment.heading);
        formData.append(`segments[${index}][subheading]`, segment.subheading);
        formData.append(`segments[${index}][content]`, segment.content);
        if (segment.imageFile) {
          formData.append(`segments[${index}][image]`, segment.imageFile);
        }
      });

      const response = await fetch(`/api/blogs/edit`, {
        method: "PUT",
        body: formData,
      });

      if (response.ok) {
        console.log("Blog updated successfully!");
        router.push("/blogs");
      } else {
        setErrorMessage("Failed to update blog.");
      }
    } catch (error) {
      setErrorMessage("Error updating blog.");
      console.error("Error updating blog:", error);
    }
  };

  const handleDeleteBlog = async () => {
    if (!confirm("Are you sure you want to delete this blog?")) return;

    try {
      const response = await fetch(`/api/blogs/edit`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: blog.id,
          titleImage: blog.titleImagePreview,
        }),
      });

      if (response.ok) {
        console.log("Blog deleted successfully!");
        router.push("/blogs");
      } else {
        setErrorMessage("Failed to delete blog.");
      }
    } catch (error) {
      setErrorMessage("Error deleting blog.");
      console.error("Error deleting blog:", error);
    }
  };

  if (loading) {
    return <p>Loading...</p>;
  }

  if (errorMessage) {
    return <p className="text-red-500">{errorMessage}</p>;
  }

  return (
    <div className="p-6 w-full">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Edit Blog</h1>
        <div className="space-x-2">
          <Button
            className="font-bold"
            size="default"
            onClick={handleUpdateBlog}
            disabled={!blog.title}
          >
            Update Blog
          </Button>
          <Button
            className="font-bold"
            size="default"
            variant="destructive"
            onClick={handleDeleteBlog}
          >
            Delete Blog
          </Button>
        </div>
      </div>

      {/* Title Section */}
      <Card className="p-6 mb-6 space-y-4">
        <Input
          placeholder="Enter Blog Title"
          className="text-2xl font-bold"
          value={blog.title}
          onChange={(e) => setBlog({ ...blog, title: e.target.value })}
        />
        <div>
          <label className="block text-sm font-medium mb-2">Title Image</label>
          <Input
            type="file"
            accept="image/*"
            onChange={(e) => {
              if (e.target.files?.[0]) {
                const file = e.target.files[0];
                setBlog({
                  ...blog,
                  titleImageFile: file,
                  titleImagePreview: URL.createObjectURL(file),
                });
              }
            }}
          />
          {blog.titleImagePreview && (
            <img
              src={blog.titleImagePreview}
              alt="Title"
              className="mt-4 h-40 object-cover rounded-md"
            />
          )}
        </div>
      </Card>

      {/* Segments Section */}
      <div className="space-y-6">
        {blog.segments.map((segment, index) => (
          <Card key={index} className="p-6 space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-semibold">Segment {index + 1}</h3>
              <Button
                size="icon"
                variant="ghost"
                onClick={() => removeSegment(index)}
              >
                <Trash />
              </Button>
            </div>
            <Input
              placeholder="Segment Heading"
              value={segment.heading}
              onChange={(e) =>
                handleSegmentChange(index, "heading", e.target.value)
              }
            />
            <Input
              placeholder="Segment Subheading"
              value={segment.subheading}
              onChange={(e) =>
                handleSegmentChange(index, "subheading", e.target.value)
              }
            />
            <Textarea
              placeholder="Segment Content"
              value={segment.content}
              onChange={(e) =>
                handleSegmentChange(index, "content", e.target.value)
              }
            />
            <Input
              type="file"
              accept="image/*"
              onChange={(e) => {
                if (e.target.files?.[0]) {
                  handleSegmentChange(index, "imageFile", e.target.files[0]);
                }
              }}
            />
            {segment.imagePreview && (
              <img
                src={segment.imagePreview}
                alt={`Segment ${index + 1}`}
                className="mt-4 h-32 object-cover rounded-md"
              />
            )}
          </Card>
        ))}
        <Button
          variant="secondary"
          size="default"
          onClick={addSegment}
          className="flex items-center space-x-2"
        >
          <Plus />
          <span>Add Segment</span>
        </Button>
      </div>
    </div>
  );
};

export default EditBlogPage;
