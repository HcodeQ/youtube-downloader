"use client"

import type React from "react"

import { useState, useEffect } from "react"
import Image from "next/image"
import { AlertCircle, Check, Download, LinkIcon } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Progress } from "@/components/ui/progress"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Alert, AlertDescription } from "@/components/ui/alert"

export default function VideoDownloader() {
  const [videoUrl, setVideoUrl] = useState("")
  const [format, setFormat] = useState("")
  const [thumbnailUrl, setThumbnailUrl] = useState("")
  const [availableFormats, setAvailableFormats] = useState<{ format_id: string; resolution: string; ext: string }[]>([]);
  const [progress, setProgress] = useState(0)
  const [isDownloading, setIsDownloading] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState(false)
  const [videoInfo, setVideoInfo] = useState<{
    title: string
    views: string
    channel: string
    duration: string
  } | null>(null)

  // Function to validate URL
  const isValidUrl = (url: string) => {
    try {
      new URL(url)
      return true
    } catch (e) {
      return false
    }
  }

  //function to fetch formats
  /* {
    "formats": [
      { "format_id": "18", "format_note": "360p", "ext": "mp4" },
      { "format_id": "22", "format_note": "720p", "ext": "mp4" },
      { "format_id": "251", "format_note": "audio only", "ext": "webm" }
    ]
  } */
    const fetchFormats = async () => {
      if (videoUrl && isValidUrl(videoUrl)) {
        try {
          const response = await fetch("http://127.0.0.1:5328/formats", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ video_url: videoUrl }),
          });
    
          if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || "Failed fetching formats");
          }
    
          const data: { formats: { format_id: string; resolution: string; ext: string }[] } = await response.json();
    
          // Set available formats
          setAvailableFormats(data.formats); // Mettre à jour l'état avec des formats uniques
          setError("");
        } catch (err) {
          setError(err instanceof Error ? err.message : "An error occurred");
          setAvailableFormats([]);
        }
      } else {
        setAvailableFormats([]);
        setError("Please enter a valid URL");
      }
    };

  // Fetch available formats when video URL changes
  useEffect(() => {
    if (videoUrl && isValidUrl(videoUrl)) {
      fetchFormats()
    } else {
      setAvailableFormats([])
      setError("Please enter a valid URL")
    }
  }, [videoUrl])

  // Function to fetch thumbnail (simplified for demo)
  useEffect(() => {
    const fetchThumbnail = async () => {
      if (videoUrl && isValidUrl(videoUrl)) {
        try {
          const response = await fetch("http://127.0.0.1:5328/video-info", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              video_url: videoUrl,
            }),
          });

          if (!response.ok) {
            const errorData = await response.json(); // Attendre la résolution de la promesse
            throw new Error(errorData.message || "Failed fetching infos");
          }

          const data = await response.json();
          console.log(data)
          setThumbnailUrl(data.thumbnailUrl);
          setVideoInfo({
            title: data.title,
            views: data.views,
            channel: data.channel,
            duration: data.duration,
          });
          setError("");
        } catch (err) {
          setError(err instanceof Error ? err.message : "An error occurred");
        }
      } else if (videoUrl) {
        setThumbnailUrl("");
        setVideoInfo(null);
        setError("Please enter a valid URL");
      } else {
        setThumbnailUrl("");
        setVideoInfo(null);
        setError("");
      }
    };

    fetchThumbnail(); // Appeler la fonction async
  }, [videoUrl]);

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!videoUrl) {
      setError("Please enter a video URL")
      return
    }

    if (!isValidUrl(videoUrl)) {
      setError("Please enter a valid URL")
      return
    }

    setError("")
    setIsDownloading(true)
    setProgress(0)
    setSuccess(false)

    try {
      // Simulate progress updates
      const progressInterval = setInterval(() => {
        setProgress((prevProgress) => {
          const newProgress = prevProgress + 10
          if (newProgress >= 100) {
            clearInterval(progressInterval)
            return 100
          }
          return newProgress
        })
      }, 500)

      // Make the actual API request
      const response = await fetch("http://127.0.0.1:5328/download", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          video_url: videoUrl,
          format: format,
        }),
      })

      // Clear the interval when the request completes
      clearInterval(progressInterval)
      setProgress(100)

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.message || "Download failed")
      }

      // Handle successful download
      setSuccess(true)
      setTimeout(() => {
        setIsDownloading(false)
      }, 1000)
    } catch (err) {
      setProgress(0)
      setIsDownloading(false)
      setError(err instanceof Error ? err.message : "Download failed. Please try again.")
    }
  }

  return (
    <Card className="overflow-hidden border-0 shadow-xl bg-white/80 backdrop-blur-sm max-w-[900px] ">
      <div className="h-2 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500"></div>
      <CardContent className="p-8">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="video-url" className="text-sm font-medium text-gray-700">
              Video URL
            </Label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                <LinkIcon className="h-4 w-4 text-gray-400" />
              </div>
              <Input
                id="video-url"
                type="text"
                placeholder="https://example.com/video"
                value={videoUrl}
                onChange={(e) => setVideoUrl(e.target.value)}
                disabled={isDownloading}
                className="pl-10 border-gray-200 focus:border-indigo-500 focus:ring-indigo-500"
              />
            </div>
          </div>

          {videoInfo && (
            <div className="bg-gray-50 rounded-lg overflow-hidden border border-gray-100">
              <div className="flex flex-col sm:flex-row">
                <div className="relative w-full sm:w-48 h-36">
                  <Image src={thumbnailUrl || "/placeholder.svg"} alt="Video thumbnail" fill className="object-cover" />
                  <div className="absolute bottom-2 right-2 bg-black/70 text-white text-xs px-1 py-0.5 rounded">
                    {videoInfo.duration}
                  </div>
                </div>
                <div className="p-4 flex-1">
                  <h3 className="font-medium text-lg line-clamp-2">{videoInfo.title}</h3>
                  <p className="text-gray-500 text-sm mt-1">{videoInfo.channel}</p>
                  <div className="flex items-center mt-2 text-sm text-gray-500">
                    <span>{videoInfo.views} views</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="format" className="text-sm font-medium text-gray-700">
              Download Format
            </Label>
            <Select value={format} onValueChange={setFormat} disabled={isDownloading}>
              <SelectTrigger id="format" className="border-gray-200 focus:border-indigo-500 focus:ring-indigo-500">
                <SelectValue placeholder="Select format" />
              </SelectTrigger>
              <SelectContent>
                {availableFormats.map((f) => (
                  <SelectItem key={f.format_id} value={f.format_id}>
                    {`${f.resolution || f.ext} (${f.ext})`}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {error && (
            <Alert variant="destructive" className="border-red-200 bg-red-50 text-red-800">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {success && (
            <Alert className="border-green-200 bg-green-50 text-green-800">
              <Check className="h-4 w-4" />
              <AlertDescription>Download completed successfully!</AlertDescription>
            </Alert>
          )}

          {isDownloading && (
            <div className="space-y-2">
              <div className="flex justify-between">
                <Label className="text-sm font-medium text-gray-700">Downloading...</Label>
                <span className="text-sm font-medium text-indigo-600">{progress}%</span>
              </div>
              <Progress value={progress} className="h-2" />
            </div>
          )}

          <Button
            type="submit"
            className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-medium py-2 px-4 rounded-md transition-all duration-200 shadow-md hover:shadow-lg"
            disabled={isDownloading || !videoUrl || !videoInfo || availableFormats.length === 0 || !format}
          >
            {isDownloading ? (
              <span className="flex items-center justify-center">Downloading...</span>
            ) : (
              <span className="flex items-center justify-center">
                <Download className="mr-2 h-4 w-4" /> Download Now
              </span>
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}

