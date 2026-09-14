import { beforeEach, describe, expect, it, vi } from 'vitest'

const call = vi.hoisted(() => vi.fn())

vi.mock('frappe-ui', () => ({ call }))

beforeEach(() => {
	call.mockReset()
	delete window.translatedMessages
	vi.resetModules()
})

describe('translation startup', () => {
	it('loads messages before callers continue bootstrapping', async () => {
		call.mockResolvedValue({ Courses: 'Cursos' })
		const { loadTranslations } = await import('@/translation')

		await expect(loadTranslations()).resolves.toEqual({ Courses: 'Cursos' })
		expect(window.translatedMessages).toEqual({ Courses: 'Cursos' })
		expect(call).toHaveBeenCalledOnce()
		expect(call).toHaveBeenCalledWith('lms.lms.api.get_translations')
	})

	it('reuses a dictionary already present on the page', async () => {
		window.translatedMessages = { Courses: 'Cursos existentes' }
		const { loadTranslations } = await import('@/translation')

		await expect(loadTranslations()).resolves.toEqual({
			Courses: 'Cursos existentes',
		})
		expect(call).not.toHaveBeenCalled()
	})

	it('falls back to source messages when the request fails', async () => {
		const warning = vi.spyOn(console, 'warn').mockImplementation(() => {})
		call.mockRejectedValue(new Error('network unavailable'))
		const { default: translationPlugin, loadTranslations } = await import(
			'@/translation'
		)

		await expect(loadTranslations()).resolves.toEqual({})
		const app = { config: { globalProperties: {} } }
		translationPlugin(app)

		expect(window.__('Courses')).toBe('Courses')
		expect(warning).toHaveBeenCalledOnce()
		warning.mockRestore()
	})
})
