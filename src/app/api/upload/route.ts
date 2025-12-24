import { NextRequest, NextResponse } from "next/server";
import { v2 as cloudinary } from "cloudinary";

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get("file") as File;

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    // Convert file to base64
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    const base64 = buffer.toString("base64");
    const mimeType = file.type;
    const dataUri = `data:${mimeType};base64,${base64}`;

    // Determine resource type based on file type
    let resourceType: "image" | "video" | "raw" = "image";
    if (mimeType.startsWith("video/")) {
      resourceType = "video";
    } else if (!mimeType.startsWith("image/")) {
      resourceType = "raw";
    }

    const result = await cloudinary.uploader.upload(dataUri, {
      folder: "notes-dynamic",
      resource_type: resourceType,
    });

    return NextResponse.json({ url: result.secure_url });
  } catch (error) {
    console.error("Cloudinary upload error:", error);
    return NextResponse.json(
      { error: "Failed to upload file" },
      { status: 500 }
    );
  }
}
