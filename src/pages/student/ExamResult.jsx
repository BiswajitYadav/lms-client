import React, { useContext, useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import axios from 'axios'
import { toast } from 'react-toastify'
import { AppContext } from '../../context/AppContext'
import Loading from '../../components/student/Loading'
import Footer from '../../components/student/Footer'

const ExamResult = () => {
  const { courseId } = useParams()
  const navigate = useNavigate()
  const { backendUrl, getToken } = useContext(AppContext)

  const [result, setResult] = useState(null)
  const [loading, setLoading] = useState(true)

  const fetchResult = async () => {
    try {
      const token = await getToken()
      const { data } = await axios.get(`${backendUrl}/api/exam/result/${courseId}`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      if (data.success) {
        setResult(data.result)
      } else {
        toast.error(data.message)
        navigate('/my-enrollments')
      }
    } catch (error) {
      toast.error(error.message)
      navigate('/my-enrollments')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchResult()
  }, [])

  if (loading) return <Loading />

  return (
    <>
      <div className="md:px-36 px-6 py-10 min-h-screen">
        {/* Score Summary */}
        <div
          className={`rounded-xl p-6 mb-8 text-center border-2 ${
            result.passed
              ? 'border-green-400 bg-green-50'
              : 'border-red-400 bg-red-50'
          }`}
        >
          <div
            className={`inline-block text-4xl font-bold mb-2 ${
              result.passed ? 'text-green-600' : 'text-red-600'
            }`}
          >
            {result.percentage}%
          </div>
          <p
            className={`text-xl font-semibold mb-1 ${
              result.passed ? 'text-green-700' : 'text-red-700'
            }`}
          >
            {result.passed ? '🎉 You Passed!' : '😔 You Failed'}
          </p>
          <p className="text-gray-600">
            Score: {result.score} / {result.totalQuestions} &nbsp;|&nbsp; Passing Score:{' '}
            {result.passingScore}%
          </p>
          {result.submittedAt && (
            <p className="text-gray-400 text-sm mt-1">
              Submitted on {new Date(result.submittedAt).toLocaleString()}
            </p>
          )}
        </div>

        {/* Review */}
        <h2 className="text-xl font-semibold mb-4">Answer Review</h2>
        <div className="space-y-6">
          {result.review.map((item, index) => (
            <div
              key={index}
              className={`border rounded-lg p-5 ${
                item.isCorrect
                  ? 'border-green-300 bg-green-50'
                  : 'border-red-300 bg-red-50'
              }`}
            >
              <p className="font-medium text-gray-800 mb-3">
                <span
                  className={`mr-2 font-semibold ${
                    item.isCorrect ? 'text-green-600' : 'text-red-600'
                  }`}
                >
                  Q{item.questionIndex + 1}.
                </span>
                {item.question}
              </p>
              <ul className="space-y-1 text-sm">
                {item.options.map((opt, i) => {
                  const isCorrect = opt === item.correctOption
                  const isSelected = opt === item.selectedOption
                  return (
                    <li
                      key={i}
                      className={`flex items-center gap-2 px-3 py-2 rounded ${
                        isCorrect
                          ? 'bg-green-100 text-green-800 font-medium'
                          : isSelected && !isCorrect
                          ? 'bg-red-100 text-red-800'
                          : 'text-gray-600'
                      }`}
                    >
                      {isCorrect ? '✅' : isSelected ? '❌' : '○'}
                      <span>{opt}</span>
                      {isCorrect && (
                        <span className="ml-auto text-xs text-green-600 font-semibold">
                          Correct
                        </span>
                      )}
                      {isSelected && !isCorrect && (
                        <span className="ml-auto text-xs text-red-600 font-semibold">
                          Your Answer
                        </span>
                      )}
                    </li>
                  )
                })}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-10 flex gap-4">
          <button
            onClick={() => navigate('/my-enrollments')}
            className="px-6 py-2 border border-gray-300 rounded hover:bg-gray-50"
          >
            My Enrollments
          </button>
          <button
            onClick={() => navigate(`/player/${courseId}`)}
            className="px-6 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Back to Course
          </button>
        </div>
      </div>
      <Footer />
    </>
  )
}

export default ExamResult
