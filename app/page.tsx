"use client";

import React from "react";
import useFetch from "@/hooks/useFetch";

const Page = () => {
  const {
    data: BlogData,
    error: BlogError,
    loading: LoadingBlogs,
  } = useFetch("/api/getdata/blogs");
  const {
    data: CareerData,
    error: CareerError,
    loading: LoadingCareers,
  } = useFetch("/api/getdata/careers");
  const {
    data: TagData,
    error: TagError,
    loading: LoadingTags,
  } = useFetch("/api/getdata/tags");
  const {
    data: CategoryData,
    error: CategoryError,
    loading: LoadingCategories,
  } = useFetch("/api/getdata/categories");

  if (LoadingBlogs || LoadingCareers || LoadingTags || LoadingCategories)
    return <p>Loading...</p>;

  if (BlogError || CareerError || TagError || CategoryError)
    return (
      <p>
        Error: {BlogError?.message || CareerError?.message || TagError?.message || CategoryError?.message}
      </p>
    );

  return (
    <div>
      <p>
        {BlogData && CareerData && TagData && CategoryData
          ? "Data fetched successfully!:"
          : "No data available."}
      </p>
    </div>
  );
};

export default Page;
