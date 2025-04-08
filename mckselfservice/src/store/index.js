import { createStore } from 'vuex'

export default createStore({
  state: {
    generatedUsername: '',
    generatedPassword: '',
    createdUser: null,
    loading: false,
    error: null
  },
  mutations: {
    SET_USERNAME(state, username) {
      state.generatedUsername = username;
    },
    SET_PASSWORD(state, password) {
      state.generatedPassword = password;
    },
    SET_CREATED_USER(state, user) {
      state.createdUser = user;
    },
    SET_LOADING(state, status) {
      state.loading = status;
    },
    SET_ERROR(state, error) {
      state.error = error;
    }
  },
  actions: {
    // Actions will be implemented later
  },
  getters: {
    generatedUsername: state => state.generatedUsername,
    generatedPassword: state => state.generatedPassword,
    createdUser: state => state.createdUser,
    isLoading: state => state.loading,
    hasError: state => state.error !== null,
    errorMessage: state => state.error
  }
}) 