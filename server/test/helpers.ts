import { NextFunction, Request, Response } from "express";
import { jest } from "@jest/globals";

export type MockResponse = Response & {
  status: jest.Mock;
  json: jest.Mock;
};

export function createResponse(): MockResponse {
  const res: Record<string, unknown> = {};
  res.status = jest.fn(() => res);
  res.json = jest.fn(() => res);
  return res as unknown as MockResponse;
}

export function createRequest(overrides: Record<string, unknown> = {}): Request {
  return { session: {}, params: {}, ...overrides } as unknown as Request;
}

export function createNext(): jest.Mock & NextFunction {
  return jest.fn() as unknown as jest.Mock & NextFunction;
}
