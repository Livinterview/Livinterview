import React from 'react';
import styled from 'styled-components';
import LoginButton from '../components/LoginButton';

const Container = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100vh;
  background-color: #f0f2f5;
`;

const Title = styled.h1`
  margin-bottom: 20px;
  color: #333;
`;

const LoginPage: React.FC = () => {
  return (
    <Container>
      <Title>Social Login</Title>
      <LoginButton provider="google" />
      <LoginButton provider="kakao" />
      <LoginButton provider="naver" />
    </Container>
  );
};

export default LoginPage;