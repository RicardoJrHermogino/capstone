import React, { useState } from 'react';
import Link from 'next/link';
import { Button, Box, styled } from "@mui/material";
import HomeRoundedIcon from '@mui/icons-material/HomeRounded';
import ThunderstormRoundedIcon from '@mui/icons-material/ThunderstormRounded';
import AddIcon from '@mui/icons-material/Add';
import CalendarMonthIcon from '@mui/icons-material/CalendarMonth';
import { useRouter } from 'next/router';
import CheckTaskFeasibilityPage from '../checktask';

const StyledLink = styled(Link)`
  && {
    color: inherit;
    text-decoration: none;
  }
`;

const NavButtonsContainer = styled(Box)`
  position: fixed;
  bottom: 20px;
  left: 25%;
  transform: translateX(-25%);
  display: flex;
  justify-content: center;
  align-items: center;
  background-color: #f0f4ff;
  padding: 8px;
  border-radius: 40px;
  gap: 16px;
`;

const FloatingButton = styled(Button)`
  position: fixed;
  right: 45px;
  bottom: 30px;
  background-color: #48ccb4;
  border-radius: 50%;
  width: 56px;
  height: 63px;

  &:hover {
    background-color: #303456;
  }
`;

const ActiveButton = styled(Button)`
  color: #48ccb4;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 64px;
  height: 64px;
  border-radius: 50%;
  background-color: rgba(72, 204, 180, 0.1);

  &:hover {
    background-color: transparent;
  }

  & svg {
    color: #48ccb4;
  }
`;

const InactiveButton = styled(Button)`
  color: black;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 64px;
  height: 64px;
  border-radius: 50%;

  &:hover {
    background-color: #f0f4ff;
  }

  & svg {
    color: inherit;
  }
`;

export default function Navbar() {
  const router = useRouter();
  const [modalOpen, setModalOpen] = useState(false);

  return (
    <>
      <NavButtonsContainer>
        <StyledLink href="/dashboard" passHref>
          {router.pathname === '/dashboard' ? (
            <ActiveButton>
              <HomeRoundedIcon fontSize="large" />
            </ActiveButton>
          ) : (
            <InactiveButton>
              <HomeRoundedIcon fontSize="medium" />
            </InactiveButton>
          )}
        </StyledLink>

        <StyledLink href="/forecast" passHref>
          {router.pathname === '/forecast' ? (
            <ActiveButton>
              <ThunderstormRoundedIcon fontSize="large" />
            </ActiveButton>
          ) : (
            <InactiveButton>
              <ThunderstormRoundedIcon fontSize="medium" />
            </InactiveButton>
          )}
        </StyledLink>

        <StyledLink href="/task" passHref>
          {router.pathname === '/task' ? (
            <ActiveButton>
              <CalendarMonthIcon fontSize="large" />
            </ActiveButton>
          ) : (
            <InactiveButton>
              <CalendarMonthIcon fontSize="medium" />
            </InactiveButton>
          )}
        </StyledLink>
      </NavButtonsContainer>

      <FloatingButton onClick={() => setModalOpen(true)}>
        <AddIcon fontSize="large" sx={{ color: 'white' }} />
      </FloatingButton>

      <CheckTaskFeasibilityPage open={modalOpen} handleClose={() => setModalOpen(false)} />
    </>
  );
}