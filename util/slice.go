package util

func SliceContains[T comparable](slice []T, target T) bool {
	for _, num := range slice {
		if num == target {
			return true
		}
	}
	return false
}

func SliceFilter[T any](slice []T, keep func(T) bool) []T {
	result := make([]T, 0, len(slice))

	for _, item := range slice {
		if keep(item) {
			result = append(result, item)
		}
	}

	return result
}
