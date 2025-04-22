import React, { useEffect, useState } from 'react';
import styled from 'styled-components';
import axios from 'axios';

const Container = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100vh;
  background-color: #f0f2f5;
`;

const Iframe = styled.iframe`
  width: 400px;
  height: 400px;
  border: none;
`;

const ErrorMessage = styled.p`
  color: red;
`;

const ProfilePage = () => {
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchUserInfo = async () => {
        try {
          const response = await axios.get('/api/profile', {  // 프록시로 인해 간소화
            withCredentials: true,
          });
          setUser(response.data);
        } catch (err) {
          if (axios.isAxiosError(err) && err.response?.status === 401) {
            window.location.href = '/';
          } else {
            setError('Failed to load user info');
          }
        }
      };
      fetchUserInfo();
  }, []);
  const handleLogout = async () => {
    try {
      await axios.get('/logout', { withCredentials: true });  // 프록시 사용
      window.location.href = '/';
    } catch (err) {
      setError('Failed to logout');
    }
  };

  return (
    <Container>
      {error && <ErrorMessage>{error}</ErrorMessage>}
      <Iframe src="http://127.0.0.1:8000/profile" title="User Profile" />
    </Container>
  );
};

export default ProfilePage;