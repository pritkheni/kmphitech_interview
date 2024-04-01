import { Request, Response, response } from "express";
import { pool } from "../database/db";
import { QueryResult } from "pg";
import { Student, Teacher } from "../types";
import fs from "fs";
import {
  createSchemaValidation,
  deleteParamsSchema,
  paginationQuery,
  ratingSchemaValidation,
  updateSchemaValidation,
} from "../validation/zodSchema";
import path from "path";
const getUser = async (req: Request, res: Response) => {
  try {
    const query = req.query;
    let limit = 10;
    let page = 1;
    const parseQuery = paginationQuery.safeParse(query);
    if (parseQuery.success) {
      limit = parseQuery.data.limit;
      page = parseQuery.data.page;
    }
    console.log(query);
    const connection = await pool.connect();
    const count = await connection.query(
      `SELECT count(*) as total_count FROM STUDENTS S JOIN RATE R ON S.ID = R.S_ID AND S.T_ID = R.T_ID`
    );
    let total = count.rows[0].total_count ?? 0;
    const totalPage = Math.ceil(total / limit);
    if (page > totalPage) {
      page = 1;
    }
    const result: QueryResult<Student> = await connection.query<Student>(
      `SELECT S.ID,S.NAME,S.EMAIL,S.PROFILE,R.RATE 
      FROM STUDENTS S 
      JOIN RATE R ON S.ID = R.S_ID AND S.T_ID = R.T_ID 
      ORDER BY R.RATE DESC,S.ID ASC 
      LIMIT $1 
      OFFSET $2`,
      [limit, page > 0 ? (page - 1) * limit : 0]
    );
    res
      .status(200)
      .json({ sudents: result.rows, total: totalPage, currentPage: page });
  } catch (err) {
    console.log(err);
  }
};

const createUser = async (req: Request, res: Response) => {
  try {
    //db connection
    const connection = await pool.connect();

    //body validation
    const parseBody = createSchemaValidation.safeParse(req.body);
    if (!parseBody.success) {
      if (req.file) {
        await fs.unlinkSync(req.file.path);
      }
      return res
        .status(400)
        .json({ message: "Please provide valid body data" });
    }

    //check existing student
    const exist = await connection.query(
      `SELECT ID FROM STUDENTS WHERE EMAIL = $1`,
      [parseBody.data.email]
    );
    if (exist.rowCount) {
      if (req.file) {
        await fs.unlinkSync(req.file.path);
      }
      return res
        .status(409)
        .json({ message: "student with this email is already exist" });
    }

    //get teachers id to assign to student
    const teachersId = await connection.query(`SELECT ID FROM TEACHERS`);
    if (!teachersId.rowCount) {
      if (req.file) {
        await fs.unlinkSync(req.file.path);
      }
      return res
        .status(409)
        .json({ message: "No teacher to assign to student" });
    }
    const rendomIndex = Math.floor(Math.random() * teachersId.rowCount);
    const teacherId = teachersId.rows[rendomIndex].id;

    //create student
    const response = await connection.query(
      `INSERT INTO STUDENTS (NAME,EMAIL,PROFILE,T_ID) VALUES ($1,$2,$3,$4)`,
      [
        parseBody.data.name,
        parseBody.data.email,
        !req.file ? "default.png" : req.file.filename,
        teacherId,
      ]
    );
    console.log(response);
    res.sendStatus(201);
  } catch (err) {
    if (req.file) {
      await fs.unlinkSync(req.file.path);
    }
    console.log(err);
    res.sendStatus(500);
  }
};

const deleteUser = async (req: Request, res: Response) => {
  const connection = await pool.connect();
  //validate params
  const parsParams = deleteParamsSchema.safeParse(req.params);
  if (!parsParams.success) {
    return res.status(400).json({ message: "please pass valid params" });
  }

  //find student with this id if not found return
  const exist: QueryResult<Pick<Student, "profile">> = await connection.query<
    Pick<Student, "profile">
  >(`SELECT PROFILE FROM STUDENTS WHERE ID = $1`, [parsParams.data.id]);
  if (!exist.rowCount) {
    return res.status(409).json({ message: "studnet with this id not exist" });
  }
  const deleteFilePath = path.join(
    __dirname,
    "..",
    "uploads",
    exist.rows[0].profile
  );
  console.log(deleteFilePath);
  if (fs.existsSync(deleteFilePath)) {
    await fs.unlinkSync(deleteFilePath);
  }

  //delete id
  const response = await connection.query(
    `DELETE FROM STUDENTS WHERE ID = $1`,
    [parsParams.data.id]
  );
  console.log(response);
  return res.sendStatus(204);
};
const giveRate = async (req: Request, res: Response) => {
  try {
    //db connection
    const connection = await pool.connect();

    //validate body
    const parseBody = ratingSchemaValidation.safeParse(req.body);
    if (!parseBody.success) {
      return res.status(400).json({ message: "please pass valid body" });
    }

    //find student and chek it assigned teacher id is same as given body params
    const exist = await connection.query(
      `SELECT T_ID FROM STUDENTS WHERE ID = $1`,
      [parseBody.data.student_id]
    );
    if (!exist.rowCount)
      return res
        .status(409)
        .json({ message: "Student not found with given id" });
    if (exist.rows[0].t_id !== parseBody.data.teacher_id)
      return res
        .status(409)
        .json({ message: "You can not give to another teacher rate" });
    //CHECK IF USER ALREADY GIVEN THE RATE
    const existRate = await connection.query(
      `SELECT S_ID FROM RATE WHERE S_ID = $1 AND T_ID = $2`,
      [parseBody.data.student_id, parseBody.data.teacher_id]
    );
    if (existRate.rowCount)
      return res.status(409).json({
        message: "student already give rate to his-her assigned teacher",
      });
    const submitRate = await connection.query(
      `INSERT INTO RATE (S_ID,T_ID,RATE) VALUES ($1,$2,$3::DECIMAL)`,
      [
        parseBody.data.student_id,
        parseBody.data.teacher_id,
        parseBody.data.rate,
      ]
    );
    res.sendStatus(201);
  } catch (err) {
    console.log(err);
    res.sendStatus(500);
  }
};

const updateStudent = async (req: Request, res: Response) => {
  try {
    //connect to db
    const connection = await pool.connect();
    const parseBody = updateSchemaValidation.safeParse(req.body);
    if (!parseBody.success) {
      if (req.file) {
        await fs.unlinkSync(req.file.path);
      }
      return res.status(400).json({ message: "please pass valid body" });
    }
    const update = await connection.query(
      `UPDATE STUDENTS SET NAME=$1,EMAIL=$2 WHERE ID = $3`,
      [parseBody.data.name, parseBody.data.email, parseBody.data.id.toString()]
    );
    res.sendStatus(201);
  } catch (err) {
    console.log(err);
    res.sendStatus(500);
  }
};
export default {
  getUser,
  createUser,
  deleteUser,
  giveRate,
  updateStudent,
};
