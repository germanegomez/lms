import { call } from 'frappe-ui'

let translationsPromise

export default function translationPlugin(app) {
	app.config.globalProperties.__ = translate
	window.__ = translate
}

function translate(message) {
	let translatedMessages = window.translatedMessages || {}
	let translatedMessage = translatedMessages[message] || message

	const hasPlaceholders = /{\d+}/.test(message)
	if (!hasPlaceholders) {
		return translatedMessage
	}
	return {
		format: function (...args) {
			return translatedMessage.replace(
				/{(\d+)}/g,
				function (match, number) {
					return typeof args[number] != 'undefined'
						? args[number]
						: match
				}
			)
		},
	}
}

export function loadTranslations() {
	if (window.translatedMessages) {
		return Promise.resolve(window.translatedMessages)
	}
	if (translationsPromise) {
		return translationsPromise
	}

	translationsPromise = call('lms.lms.api.get_translations')
		.then((data) => {
			window.translatedMessages = data || {}
			return window.translatedMessages
		})
		.catch((error) => {
			console.warn('Unable to load translations; using source messages.', error)
			window.translatedMessages = {}
			return window.translatedMessages
		})

	return translationsPromise
}
