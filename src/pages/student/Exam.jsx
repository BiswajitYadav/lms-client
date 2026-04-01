import React, { useContext, useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import axios from 'axios'
import { toast } from 'react-toastify'
import { AppContext } from '../../context/AppContext'
import Loading from '../../components/student/Loading'
import Footer from '../../components/student/Footer'

const Exam = () => {
  const { courseId } = useParams()
  const navigate = useNavigate()
  const { backendUrl, getToken } = useContext(AppContext)

  const [exam, setExam] = useState(null)
  const [loading, setLoading] = useState(true)
  const [answers, setAnswers] = useState({})
  const [submitting, setSubmitting] = useState(false)
  const [timeLeft, setTimeLeft] = useState(null)

  const fetchExam = async () => {
    try {
      const token = await getToken()
      const { data } = await axios.get(`${backendUrl}/api/exam/${courseId}`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      if (data.success) {
        setExam(data.exam)
        setTimeLeft(data.exam.duration * 60)
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
    fetchExam()
  }, [])

  useEffect(() => {
    if (timeLeft === null) return
    if (timeLeft <= 0) {
      handleSubmit(true)
      return
    }
    const timer = setInterval(() => {
      setTimeLeft((prev) => prev - 1)
    }, 1000)
    return () => clearInterval(timer)
  }, [timeLeft])

  const formatTime = (seconds) => {
    const m = Math.floor(seconds / 60)
    const s = seconds % 60
    return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
  }

  const handleSelect = (questionIndex, option) => {
    setAnswers((prev) => ({ ...prev, [questionIndex]: option }))
  }

  const handleSubmit = async (autoSubmit = false) => {
    if (!autoSubmit) {
      const unanswered = exam.questions.length - Object.keys(answers).length
      if (unanswered > 0) {
        const confirmed = window.confirm(
          `You have ${unanswered} unanswered question(s). Submit anyway?`
        )
        if (!confirmed) return
      }
    }

    setSubmitting(true)
    try {
      const token = await getToken()
      const formattedAnswers = Object.entries(answers).map(([questionIndex, selectedOption]) => ({
        questionIndex: Number(questionIndex),
        selectedOption,
      }))

      const { data } = await axios.post(
        `${backendUrl}/api/exam/submit`,
        { courseId, answers: formattedAnswers },
        { headers: { Authorization: `Bearer ${token}` } }
      )

      if (data.success) {
        toast.success(data.message)
        navigate(`/exam/result/${courseId}`)
      } else {
        toast.error(data.message)
      }
    } catch (error) {
      toast.error(error.message)
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) return <Loading />

  return (
    <>
      <div className="md:px-36 px-6 py-10 min-h-screen">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-semibold">{exam.title}</h1>
            <p className="text-gray-500 text-sm mt-1">
              {exam.questions.length} Questions &nbsp;|&nbsp; Passing Score: {exam.passingScore}%
            </p>
          </div>
          <div
            className={`text-xl font-mono font-bold px-4 py-2 rounded border ${
              timeLeft <= 60
                ? 'text-red-600 border-red-300 bg-red-50'
                : 'text-blue-600 border-blue-300 bg-blue-50'
            }`}
          >
            ⏱ {formatTime(timeLeft)}
          </div>
        </div>

        <div className="space-y-8">
          {exam.questions.map((q, qIndex) => (
            <div key={qIndex} className="border border-gray-200 rounded-lg p-5 bg-white shadow-sm">
              <p className="font-medium text-gray-800 mb-4">
                <span className="text-blue-600 mr-2">Q{qIndex + 1}.</span>
                {q.question}
              </p>
              <div className="space-y-2">
                {q.answers.map((ans, aIndex) => (
                  <label
                    key={aIndex}
                    className={`flex items-center gap-3 p-3 rounded cursor-pointer border transition-colors ${
                      answers[qIndex] === ans.option
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-200 hover:bg-gray-50'
                    }`}
                  >
                    <input
                      type="radio"
                      name={`question-${qIndex}`}
                      value={ans.option}
                      checked={answers[qIndex] === ans.option}
                      onChange={() => handleSelect(qIndex, ans.option)}
                      className="accent-blue-600"
                    />
                    <span className="text-gray-700">{ans.option}</span>
                  </label>
                ))}
              </div>
            </div>
          ))}
        </div>

        <div className="mt-10 flex justify-end">
          <button
            onClick={() => handleSubmit(false)}
            disabled={submitting}
            className="px-8 py-3 bg-blue-600 text-white rounded font-medium hover:bg-blue-700 disabled:opacity-50"
          >
            {submitting ? 'Submitting...' : 'Submit Exam'}
          </button>
        </div>
      </div>
      <Footer />
    </>
  )
}

export default Exam
