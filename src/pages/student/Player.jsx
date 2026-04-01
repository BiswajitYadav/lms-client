import React, { useContext, useEffect, useState } from 'react'
import { AppContext } from '../../context/AppContext'
import YouTube from 'react-youtube';
import { assets } from '../../assets/assets';
import { useParams, useNavigate } from 'react-router-dom';
import humanizeDuration from 'humanize-duration';
import axios from 'axios';
import { toast } from 'react-toastify';
import Rating from '../../components/student/Rating';
import Footer from '../../components/student/Footer';
import Loading from '../../components/student/Loading';

const Player = () => {

  const {
    enrolledCourses,
    backendUrl,
    getToken,
    calculateChapterTime,
    userData,
    fetchUserEnrolledCourses
  } = useContext(AppContext);

  const { courseId } = useParams();
  const navigate = useNavigate();
  const [courseData, setCourseData] = useState(null);
  const [progressData, setProgressData] = useState(null);
  const [openSections, setOpenSections] = useState({});
  const [playerData, setPlayerData] = useState(null);
  const [initialRating, setInitialRating] = useState(0);

  const getCourseData = () => {
    enrolledCourses?.forEach((course) => {
      if (course?._id === courseId) {
        setCourseData(course);
        course?.courseRatings?.forEach((item) => {
          if (item?.userId === userData?._id) {
            setInitialRating(item?.rating);
          }
        });
      }
    });
  };

  const toggleSection = (index) => {
    setOpenSections((prev) => ({
      ...prev,
      [index]: !prev[index],
    }));
  };

  useEffect(() => {
    if (enrolledCourses?.length > 0) getCourseData();
  }, [enrolledCourses]);

  const markLectureAsCompleted = async (lectureId) => {
    try {
      const token = await getToken();
      const { data } = await axios.post(
        `${backendUrl}/api/user/update-course-progress`,
        { courseId, lectureId },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (data?.success) {
        toast.success(data?.message);
        getCourseProgress();
      } else {
        toast.error(data?.message);
      }
    } catch (error) {
      toast.error(error?.message);
    }
  };

  const getCourseProgress = async () => {
    try {
      const token = await getToken();
      const { data } = await axios.post(
        `${backendUrl}/api/user/get-course-progress`,
        { courseId },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (data?.success) {
        setProgressData(data?.progressData);
      } else {
        toast.error(data?.message);
      }
    } catch (error) {
      toast.error(error?.message);
    }
  };

  const handleRate = async (rating) => {
    try {
      const token = await getToken();
      const { data } = await axios.post(
        `${backendUrl}/api/user/add-rating`,
        { courseId, rating },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (data?.success) {
        toast.success(data?.message);
        fetchUserEnrolledCourses();
      } else {
        toast.error(data?.message);
      }
    } catch (error) {
      toast.error(error?.message);
    }
  };

  console.log(playerData)

  useEffect(() => {
    getCourseProgress();
  }, []);

  return courseData ? (
    <>
      <div className='p-4 sm:p-10 flex flex-col-reverse md:grid md:grid-cols-2 gap-10 md:px-36'>
        {/* Left: Course Structure */}
        <div className="text-gray-800">
          <h2 className="text-xl font-semibold">Course Structure</h2>

          <div className="pt-5">
            {courseData?.courseContent?.map((chapter, index) => (
              <div key={index} className="border border-gray-300 bg-white mb-2 rounded">
                <div
                  className="flex items-center justify-between px-4 py-3 cursor-pointer select-none"
                  onClick={() => toggleSection(index)}
                >
                  <div className="flex items-center gap-2">
                    <img
                      src={assets.down_arrow_icon}
                      alt="arrow icon"
                      className={`transform transition-transform ${openSections[index] ? "rotate-180" : ""}`}
                    />
                    <p className="font-medium md:text-base text-sm">{chapter?.chapterTitle}</p>
                  </div>
                  <p className="text-sm md:text-default">
                    {chapter?.chapterContent?.length} lectures - {calculateChapterTime?.(chapter)}
                  </p>
                </div>

                <div
                  className={`overflow-hidden transition-all duration-300 ${openSections[index] ? "max-h-96" : "max-h-0"}`}
                >
                  <ul className="list-disc md:pl-10 pl-4 pr-4 py-2 text-gray-600 border-t border-gray-300">
                    {chapter?.chapterContent?.map((lecture, i) => (
                      <li key={i} className="flex items-start gap-2 py-1">
                        <img
                          src={
                            progressData?.lectureCompleted?.includes(lecture?.lectureId)
                              ? assets.blue_tick_icon
                              : assets.play_icon
                          }
                          alt="bullet icon"
                          className="w-4 h-4 mt-1"
                        />
                        <div className="flex items-center justify-between w-full text-gray-800 text-xs md:text-default">
                          <p>{lecture?.lectureTitle}</p>
                          <div className="flex gap-2">
                            {lecture?.lectureUrl && (
                              <p
                                onClick={() =>
                                  setPlayerData({
                                    ...lecture,
                                    chapter: index + 1,
                                    lecture: i + 1,
                                  })
                                }
                                className="text-blue-500 cursor-pointer"
                              >
                                Watch
                              </p>
                            )}
                            <p>
                              {humanizeDuration((lecture?.lectureDuration ?? 0) * 60 * 1000, {
                                units: ['h', 'm'],
                              })}
                            </p>
                          </div>
                        </div>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            ))}
          </div>

          <div className="flex items-center gap-2 py-3 mt-10">
            <h1 className="text-xl font-bold">Rate this Course:</h1>
            <Rating initialRating={initialRating ?? 0} onRate={handleRate} />
          </div>

          {/* Exam Section */}
          {(() => {
            const totalLectures = courseData?.courseContent?.reduce(
              (sum, ch) => sum + (ch?.chapterContent?.length || 0),
              0
            ) || 0;
            const completedLectures = progressData?.lectureCompleted?.length || 0;
            const isCourseComplete = totalLectures > 0 && completedLectures >= totalLectures;
            if (!isCourseComplete) return null;
            return (
              <div className="mt-4 p-4 border border-blue-200 rounded-lg bg-blue-50">
                <h2 className="font-semibold text-blue-800 mb-1">Course Exam</h2>
                <p className="text-sm text-blue-600 mb-3">
                  You have completed all lectures. Take the final exam!
                </p>
                <div className="flex gap-3">
                  <button
                    onClick={() => navigate(`/exam/${courseId}`)}
                    className="px-5 py-2 bg-blue-600 text-white text-sm rounded hover:bg-blue-700"
                  >
                    Take Exam
                  </button>
                  <button
                    onClick={() => navigate(`/exam/result/${courseId}`)}
                    className="px-5 py-2 border border-blue-400 text-blue-600 text-sm rounded hover:bg-blue-100"
                  >
                    View Result
                  </button>
                </div>
              </div>
            );
          })()}
        </div>

        {/* Right: Player */}
        <div className="md:mt-10">
          {playerData ? (
            <div>
              <YouTube
                iframeClassName="w-full aspect-video"
                videoId={playerData?.lectureUrl?.split('/watch?v=')?.pop()}
              />
              <div className="flex justify-between items-center mt-1">
                <p className="text-xl">
                  {playerData?.chapter}.{playerData?.lecture} {playerData?.lectureTitle}
                </p>
                <button
                  onClick={() => markLectureAsCompleted(playerData?.lectureId)}
                  className="text-blue-600"
                >
                  {progressData?.lectureCompleted?.includes(playerData?.lectureId)
                    ? 'Completed'
                    : 'Mark Complete'}
                </button>
              </div>
            </div>
          ) : (
            <img
              src={courseData?.courseThumbnail || ''}
              alt="course thumbnail"
              className="w-full rounded"
            />
          )}
        </div>
      </div>
      <Footer />
    </>
  ) : (
    <Loading />
  );
};

export default Player;