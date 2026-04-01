import React, { useContext, useEffect, useState } from 'react'
import axios from 'axios'
import { toast } from 'react-toastify'
import { AppContext } from '../../context/AppContext'
import Loading from '../../components/student/Loading'

const defaultQuestion = () => ({
  question: '',
  answers: [
    { option: '', isCorrect: true },
    { option: '', isCorrect: false },
    { option: '', isCorrect: false },
    { option: '', isCorrect: false },
  ],
})

const AddExam = () => {
  const { backendUrl, getToken } = useContext(AppContext)

  const [courses, setCourses] = useState(null)
  const [selectedCourseId, setSelectedCourseId] = useState('')
  const [title, setTitle] = useState('')
  const [duration, setDuration] = useState(30)
  const [passingScore, setPassingScore] = useState(50)
  const [questions, setQuestions] = useState([defaultQuestion()])
  const [saving, setSaving] = useState(false)
  const [loadingExam, setLoadingExam] = useState(false)
  const [hasExistingExam, setHasExistingExam] = useState(false)
  const [showDeleteExamModal, setShowDeleteExamModal] = useState(false)
  const [deletingExam, setDeletingExam] = useState(false)

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

  const fetchExistingExam = async (courseId) => {
    setLoadingExam(true)
    setHasExistingExam(false)
    try {
      const token = await getToken()
      const { data } = await axios.get(`${backendUrl}/api/exam/educator/${courseId}`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      if (data.success && data.exam) {
        const { exam } = data
        setTitle(exam.title || '')
        setDuration(exam.duration)
        setPassingScore(exam.passingScore)
        setQuestions(
          exam.questions.map((q) => ({
            question: q.question,
            answers: q.answers.map((a) => ({ option: a.option, isCorrect: a.isCorrect })),
          }))
        )
        setHasExistingExam(true)
      } else {
        setTitle('')
        setDuration(30)
        setPassingScore(50)
        setQuestions([defaultQuestion()])
      }
    } catch {
      setTitle('')
      setDuration(30)
      setPassingScore(50)
      setQuestions([defaultQuestion()])
    } finally {
      setLoadingExam(false)
    }
  }

  useEffect(() => {
    fetchCourses()
  }, [])

  useEffect(() => {
    if (selectedCourseId) {
      fetchExistingExam(selectedCourseId)
    } else {
      setHasExistingExam(false)
    }
  }, [selectedCourseId])

  const handleDeleteExam = async () => {
    if (!selectedCourseId) return
    setDeletingExam(true)
    try {
      const token = await getToken()
      const { data } = await axios.delete(`${backendUrl}/api/exam/${selectedCourseId}`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      if (data.success) {
        toast.success(data.message || 'Exam deleted successfully.')
        setHasExistingExam(false)
        setTitle('')
        setDuration(30)
        setPassingScore(50)
        setQuestions([defaultQuestion()])
        setShowDeleteExamModal(false)
      } else {
        toast.error(data.message)
      }
    } catch (error) {
      toast.error(error.message)
    } finally {
      setDeletingExam(false)
    }
  }

  const addQuestion = () => setQuestions((prev) => [...prev, defaultQuestion()])

  const removeQuestion = (qIndex) =>
    setQuestions((prev) => prev.filter((_, i) => i !== qIndex))

  const updateQuestion = (qIndex, value) => {
    setQuestions((prev) =>
      prev.map((q, i) => (i === qIndex ? { ...q, question: value } : q))
    )
  }

  const updateOption = (qIndex, aIndex, value) => {
    setQuestions((prev) =>
      prev.map((q, i) =>
        i === qIndex
          ? {
              ...q,
              answers: q.answers.map((a, j) =>
                j === aIndex ? { ...a, option: value } : a
              ),
            }
          : q
      )
    )
  }

  const setCorrectAnswer = (qIndex, aIndex) => {
    setQuestions((prev) =>
      prev.map((q, i) =>
        i === qIndex
          ? {
              ...q,
              answers: q.answers.map((a, j) => ({ ...a, isCorrect: j === aIndex })),
            }
          : q
      )
    )
  }

  const addOption = (qIndex) => {
    setQuestions((prev) =>
      prev.map((q, i) =>
        i === qIndex
          ? { ...q, answers: [...q.answers, { option: '', isCorrect: false }] }
          : q
      )
    )
  }

  const removeOption = (qIndex, aIndex) => {
    setQuestions((prev) =>
      prev.map((q, i) => {
        if (i !== qIndex) return q
        const updated = q.answers.filter((_, j) => j !== aIndex)
        const hasCorrect = updated.some((a) => a.isCorrect)
        if (!hasCorrect && updated.length > 0) updated[0].isCorrect = true
        return { ...q, answers: updated }
      })
    )
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!selectedCourseId) return toast.error('Please select a course.')
    for (let i = 0; i < questions.length; i++) {
      const q = questions[i]
      if (!q.question.trim()) return toast.error(`Question ${i + 1} is empty.`)
      if (q.answers.length < 2) return toast.error(`Question ${i + 1} needs at least 2 options.`)
      if (!q.answers.some((a) => a.isCorrect)) return toast.error(`Question ${i + 1} has no correct answer marked.`)
      for (let j = 0; j < q.answers.length; j++) {
        if (!q.answers[j].option.trim())
          return toast.error(`Option ${j + 1} in question ${i + 1} is empty.`)
      }
    }

    setSaving(true)
    try {
      const token = await getToken()
      const { data } = await axios.post(
        `${backendUrl}/api/exam/add`,
        { courseId: selectedCourseId, title, duration, passingScore, questions },
        { headers: { Authorization: `Bearer ${token}` } }
      )
      if (data.success) {
        toast.success(data.message)
      } else {
        toast.error(data.message)
      }
    } catch (error) {
      toast.error(error.message)
    } finally {
      setSaving(false)
    }
  }

  if (!courses) return <Loading />

  return (
    <div className="md:p-8 p-4 pt-8">
      <h2 className="text-lg font-medium pb-4">Add / Update Exam</h2>

      <form onSubmit={handleSubmit} className="space-y-6 max-w-3xl">
        {/* Course Selector */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Select Course</label>
          <select
            value={selectedCourseId}
            onChange={(e) => setSelectedCourseId(e.target.value)}
            className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">-- Choose a course --</option>
            {courses.map((c) => (
              <option key={c._id} value={c._id}>
                {c.courseTitle}
              </option>
            ))}
          </select>
        </div>

        {loadingExam ? (
          <p className="text-gray-500 text-sm">Loading existing exam...</p>
        ) : (
          selectedCourseId && (
            <>
              {/* Title */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Exam Title</label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. JavaScript Fundamentals Final Exam"
                  required
                  className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* Duration & Passing Score */}
              <div className="flex gap-4">
                <div className="flex-1">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Duration (minutes)
                  </label>
                  <input
                    type="number"
                    min={1}
                    value={duration}
                    onChange={(e) => setDuration(Number(e.target.value))}
                    className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div className="flex-1">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Passing Score (%)
                  </label>
                  <input
                    type="number"
                    min={1}
                    max={100}
                    value={passingScore}
                    onChange={(e) => setPassingScore(Number(e.target.value))}
                    className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              {/* Questions */}
              <div className="space-y-5">
                <h3 className="font-medium text-gray-800">Questions</h3>
                {questions.map((q, qIndex) => (
                  <div
                    key={qIndex}
                    className="border border-gray-200 rounded-lg p-4 bg-gray-50 space-y-3"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <label className="text-sm font-medium text-gray-700 shrink-0">
                        Q{qIndex + 1}.
                      </label>
                      <input
                        type="text"
                        value={q.question}
                        onChange={(e) => updateQuestion(qIndex, e.target.value)}
                        placeholder="Enter question"
                        className="flex-1 border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                      {questions.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removeQuestion(qIndex)}
                          className="text-red-500 text-xs hover:underline shrink-0"
                        >
                          Remove
                        </button>
                      )}
                    </div>

                    <div className="space-y-2 pl-5">
                      {q.answers.map((ans, aIndex) => (
                        <div key={aIndex} className="flex items-center gap-2">
                          <input
                            type="radio"
                            name={`correct-${qIndex}`}
                            checked={ans.isCorrect}
                            onChange={() => setCorrectAnswer(qIndex, aIndex)}
                            title="Mark as correct answer"
                            className="accent-green-600"
                          />
                          <input
                            type="text"
                            value={ans.option}
                            onChange={(e) => updateOption(qIndex, aIndex, e.target.value)}
                            placeholder={`Option ${aIndex + 1}`}
                            className="flex-1 border border-gray-300 rounded px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                          />
                          {q.answers.length > 2 && (
                            <button
                              type="button"
                              onClick={() => removeOption(qIndex, aIndex)}
                              className="text-red-400 text-xs hover:underline shrink-0"
                            >
                              ✕
                            </button>
                          )}
                        </div>
                      ))}
                      <button
                        type="button"
                        onClick={() => addOption(qIndex)}
                        className="text-blue-500 text-xs hover:underline mt-1"
                      >
                        + Add Option
                      </button>
                      <p className="text-xs text-gray-400">
                        🟢 Select the radio button next to the correct answer.
                      </p>
                    </div>
                  </div>
                ))}

                <button
                  type="button"
                  onClick={addQuestion}
                  className="px-4 py-2 border border-blue-500 text-blue-500 rounded text-sm hover:bg-blue-50"
                >
                  + Add Question
                </button>
              </div>

              <div className="flex items-center justify-between">
                <button
                  type="submit"
                  disabled={saving}
                  className="px-8 py-2.5 bg-blue-600 text-white rounded font-medium hover:bg-blue-700 disabled:opacity-50"
                >
                  {saving ? 'Saving...' : 'Save Exam'}
                </button>
                {hasExistingExam && (
                  <button
                    type="button"
                    onClick={() => setShowDeleteExamModal(true)}
                    className="px-6 py-2.5 bg-red-50 text-red-600 border border-red-200 rounded font-medium hover:bg-red-100"
                  >
                    Delete Exam
                  </button>
                )}
              </div>
            </>
          )
        )}
      </form>

      {/* Delete Exam Confirmation Modal */}
      {showDeleteExamModal && (
        <div className="fixed inset-0 flex items-center justify-center bg-black/50 z-50">
          <div className="bg-white rounded-lg p-6 max-w-sm w-full mx-4 shadow-xl">
            <h3 className="text-lg font-semibold text-gray-800 mb-2">Delete Exam</h3>
            <p className="text-sm text-gray-600 mb-4">
              Are you sure you want to delete this exam? All student results for this exam will also be removed. This action cannot be undone.
            </p>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setShowDeleteExamModal(false)}
                className="px-4 py-2 text-sm border border-gray-300 rounded hover:bg-gray-50"
                disabled={deletingExam}
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteExam}
                disabled={deletingExam}
                className="px-4 py-2 text-sm bg-red-600 text-white rounded hover:bg-red-700 disabled:opacity-50"
              >
                {deletingExam ? 'Deleting...' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default AddExam
