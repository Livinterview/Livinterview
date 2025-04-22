import React from 'react';
import styled from 'styled-components';

// 버튼 스타일링
const Button = styled.a<{ provider: string }>`
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 10px 20px;
  margin: 10px 0;
  border-radius: 5px;
  text-decoration: none;
  font-weight: bold;
  width: 200px;
  height: 40px;
  color: ${(props) => (props.provider === 'kakao' ? '#3C1E1E' : 'white')};
  background-color: ${(props) =>
    props.provider === 'google' ? '#4285F4' : // 구글 블루
    props.provider === 'kakao' ? '#FEE500' : // 카카오 옐로우
    '#03C75A'}; // 네이버 그린

  &:hover {
    opacity: 0.9;
  }
`;

const Icon = styled.img`
  width: 20px;
  height: 20px;
  margin-right: 10px;
`;

interface LoginButtonProps {
  provider: 'google' | 'kakao' | 'naver';
}

const LoginButton: React.FC<LoginButtonProps> = ({ provider }) => {
  const loginUrls = {
    google: '/auth/google',
    kakao: '/auth/kakao',
    naver: '/auth/naver',
  };

  const buttonText = {
    google: 'Login with Google',
    kakao: 'Login with Kakao',
    naver: 'Login with Naver',
  };

  // 공식 아이콘 URL (필요 시 public/icons 사용 가능)
  const iconUrls = {
    google: 'https://developers.google.com/identity/images/g-logo.png',
    kakao: 'https://developers.kakao.com/assets/img/about/logos/kakaotalksharing/kakaotalk_sharing_btn_medium.png',
    naver: 'https://developers.naver.com/docs/common/openapiguide/appregister.md#naver_login_icon',
  };

  return (
    <Button href={loginUrls[provider]} provider={provider}>
      <Icon src={iconUrls[provider]} alt={`${provider} icon`} />
      {buttonText[provider]}
    </Button>
  );
};

export default LoginButton;