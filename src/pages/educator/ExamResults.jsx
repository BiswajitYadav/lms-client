import React, { useContext, useEffect, useState } from 'react'
import axios from 'axios'
import { toast } from 'react-toastify'
import { AppContext } from '../../context/AppContext'
import Loading from '../../components/student/Loading'

const ExamResults = () => {
  const { backendUrl, getToken } = useContext(AppContext)

  const [courses, setCourses] = useState(null)
  const [selectedCourseId, setSelectedCourseId] = useState('')
  const [results, setResults] = useState(null)
  const [loadingResults, setLoadingResults] = useState(false)

  const fetchCourses = async () => {
    try {
      const token = await getToken()
      const { data } = await axios.get(`${backendUrl}/api/educator/courses`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      if (data.success) setCourses(data.courses)
    } catch (error) {
      toast.error(error.message)
    }
  }

  const fetchResults = async (courseId) => {
    setLoadingResults(true)
    setResults(null)
    try {
      const token = await getToken()
      const { data } = await axios.get(`${backendUrl}/api/exam/results/${courseId}`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      if (data.success) {
        setResults(data.results)
      } else {
        toast.error(data.message)
      }
    } catch (error) {
      toast.error(error.message)
    } finally {
      setLoadingResults(false)
    }
  }

  useEffect(() => {
    fetchCourses()
  }, [])

  useEffect(() => {
    if (selectedCourseId) fetchResults(selectedCourseId)
    else setResults(null)
  }, [selectedCourseId])

  if (!courses) return <Loading />

  return (
    <div className="md:p-8 p-4 pt-8">
      <h2 className="text-lg font-medium pb-4">Exam Results</h2>

      <div className="max-w-4xl space-y-6">
        {/* Course Selector */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Select Course</label>
          <select
            value={selectedCourseId}
            onChange={(e) => setSelectedCourseId(e.target.value)}
            className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 max-w-sm"
          >
            <option value="">-- Choose a course --</option>
            {courses.map((c) => (
              <option key={c._id} value={c._id}>
                {c.courseTitle}
              </option>
            ))}
          </select>
        </div>

        {/* Results Table */}
        {selectedCourseId && (
          <>
            {loadingResults ? (
              <p className="text-gray-500 text-sm">Loading results...</p>
            ) : results && results.length > 0 ? (
              <div className="overflow-hidden rounded-md border border-gray-200">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50 border-b border-gray-200 text-gray-700">
                    <tr>
                      <th className="px-4 py-3 text-left font-semibold">#</th>
                      <th className="px-4 py-3 text-left font-semibold">Student</th>
                      <th className="px-4 py-3 text-left font-semibold">Score</th>
                      <th className="px-4 py-3 text-left font-semibold">Percentage</th>
                      <th className="px-4 py-3 text-left font-semibold">Status</th>
                      <th className="px-4 py-3 text-left font-semibold">Submitted At</th>
                    </tr>
                  </thead>
                  <tbody className="text-gray-600 divide-y divide-gray-100">
                    {results.map((r, index) => (
                      <tr key={r._id} className="hover:bg-gray-50">
                        <td className="px-4 py-3">{index + 1}</td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            {r.userId?.imageUrl && (
                              <img
                                src={r.userId.imageUrl}
                                alt=""
                                className="w-7 h-7 rounded-full"
                              />
                            )}
                            <span>{r.userId?.name || r.userId?.email || 'Student'}</span>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          {r.score} / {r.totalQuestions}
                        </td>
                        <td className="px-4 py-3">{r.percentage}%</td>
                        <td className="px-4 py-3">
                          <span
                            className={`px-2 py-0.5 rounded-full text-xs font-semibold ${
                              r.passed
                                ? 'bg-green-100 text-green-700'
                                : 'bg-red-100 text-red-700'
                            }`}
                          >
                            {r.passed ? 'Passed' : 'Failed'}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-gray-400">
                          {new Date(r.createdAt).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}{', '}
                          {new Date(r.createdAt).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              results !== null && (
                <p className="text-gray-500 text-sm">No students have taken this exam yet.</p>
              )
            )}
          </>
        )}
      </div>
    </div>
  )
}

export default ExamResults
