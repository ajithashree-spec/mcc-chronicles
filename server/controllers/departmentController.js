const pool = require('../config/db');

/**
 * Retrieve all departments with member count.
 * Public access.
 */
async function getAllDepartments(req, res, next) {
  try {
    const [departments] = await pool.query(
      `SELECT 
         d.id,
         d.name,
         d.code,
         d.stream,
         d.head_of_department,
         d.contact_email,
         d.description,
         d.created_at,
         COUNT(u.id) AS member_count
       FROM departments d
       LEFT JOIN users u ON u.department_id = d.id AND u.is_active = 1
       GROUP BY d.id
       ORDER BY d.name ASC`
    );

    return res.status(200).json({
      success: true,
      count: departments.length,
      data: departments,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Retrieve single department by ID.
 * Public access.
 */
async function getDepartmentById(req, res, next) {
  try {
    const { id } = req.params;

    const [rows] = await pool.query(
      `SELECT 
         d.id,
         d.name,
         d.code,
         d.stream,
         d.head_of_department,
         d.contact_email,
         d.description,
         d.created_at,
         COUNT(u.id) AS member_count
       FROM departments d
       LEFT JOIN users u ON u.department_id = d.id AND u.is_active = 1
       WHERE d.id = ?
       GROUP BY d.id
       LIMIT 1`,
      [id]
    );

    if (rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Department not found',
      });
    }

    return res.status(200).json({
      success: true,
      data: rows[0],
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Create a new department.
 * Protected: super_admin only.
 */
async function createDepartment(req, res, next) {
  try {
    const { name, code, stream = 'Aided', head_of_department = null, contact_email = null, description = null } = req.body;

    if (!name || !code) {
      return res.status(400).json({
        success: false,
        error: 'Department name and unique code are required',
      });
    }

    const validStreams = ['Aided', 'Self-Financed', 'General'];
    if (stream && !validStreams.includes(stream)) {
      return res.status(400).json({
        success: false,
        error: `Invalid stream. Allowed values: ${validStreams.join(', ')}`,
      });
    }

    // Check if code is already taken
    const [existing] = await pool.query(
      'SELECT id FROM departments WHERE code = ? LIMIT 1',
      [code.trim().toUpperCase()]
    );

    if (existing.length > 0) {
      return res.status(409).json({
        success: false,
        error: `Department code '${code.trim().toUpperCase()}' is already in use`,
      });
    }

    const [result] = await pool.query(
      `INSERT INTO departments (name, code, stream, head_of_department, contact_email, description)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [
        name.trim(),
        code.trim().toUpperCase(),
        stream,
        head_of_department ? head_of_department.trim() : null,
        contact_email ? contact_email.trim().toLowerCase() : null,
        description ? description.trim() : null,
      ]
    );

    const newDepartment = {
      id: result.insertId,
      name: name.trim(),
      code: code.trim().toUpperCase(),
      stream,
      head_of_department: head_of_department ? head_of_department.trim() : null,
      contact_email: contact_email ? contact_email.trim().toLowerCase() : null,
      description: description ? description.trim() : null,
    };

    return res.status(201).json({
      success: true,
      message: 'Department created successfully',
      data: newDepartment,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Update an existing department.
 * Protected: super_admin only.
 */
async function updateDepartment(req, res, next) {
  try {
    const { id } = req.params;
    const { name, code, stream, head_of_department, contact_email, description } = req.body;

    const [existing] = await pool.query(
      'SELECT * FROM departments WHERE id = ? LIMIT 1',
      [id]
    );

    if (existing.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Department not found',
      });
    }

    const currentDept = existing[0];

    // If code is changed, ensure uniqueness
    if (code && code.trim().toUpperCase() !== currentDept.code) {
      const [duplicate] = await pool.query(
        'SELECT id FROM departments WHERE code = ? AND id != ? LIMIT 1',
        [code.trim().toUpperCase(), id]
      );

      if (duplicate.length > 0) {
        return res.status(409).json({
          success: false,
          error: `Department code '${code.trim().toUpperCase()}' is already in use by another department`,
        });
      }
    }

    const validStreams = ['Aided', 'Self-Financed', 'General'];
    if (stream && !validStreams.includes(stream)) {
      return res.status(400).json({
        success: false,
        error: `Invalid stream. Allowed values: ${validStreams.join(', ')}`,
      });
    }

    const updatedName = name !== undefined ? name.trim() : currentDept.name;
    const updatedCode = code !== undefined ? code.trim().toUpperCase() : currentDept.code;
    const updatedStream = stream !== undefined ? stream : currentDept.stream;
    const updatedHod = head_of_department !== undefined ? (head_of_department ? head_of_department.trim() : null) : currentDept.head_of_department;
    const updatedEmail = contact_email !== undefined ? (contact_email ? contact_email.trim().toLowerCase() : null) : currentDept.contact_email;
    const updatedDescription = description !== undefined ? (description ? description.trim() : null) : currentDept.description;

    await pool.query(
      `UPDATE departments 
       SET name = ?, code = ?, stream = ?, head_of_department = ?, contact_email = ?, description = ?
       WHERE id = ?`,
      [updatedName, updatedCode, updatedStream, updatedHod, updatedEmail, updatedDescription, id]
    );

    const [updatedRows] = await pool.query(
      'SELECT * FROM departments WHERE id = ? LIMIT 1',
      [id]
    );

    return res.status(200).json({
      success: true,
      message: 'Department updated successfully',
      data: updatedRows[0],
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Delete a department if no users or articles are associated.
 * Protected: super_admin only.
 */
async function deleteDepartment(req, res, next) {
  try {
    const { id } = req.params;

    const [existing] = await pool.query(
      'SELECT id, name FROM departments WHERE id = ? LIMIT 1',
      [id]
    );

    if (existing.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Department not found',
      });
    }

    // Integrity checks
    const [userRows] = await pool.query(
      'SELECT COUNT(*) as count FROM users WHERE department_id = ?',
      [id]
    );

    if (userRows[0].count > 0) {
      return res.status(400).json({
        success: false,
        error: `Cannot delete department: ${userRows[0].count} user(s) are assigned to this department. Reassign them first.`,
      });
    }

    const [articleRows] = await pool.query(
      'SELECT COUNT(*) as count FROM articles WHERE department_id = ?',
      [id]
    );

    if (articleRows[0].count > 0) {
      return res.status(400).json({
        success: false,
        error: `Cannot delete department: ${articleRows[0].count} article(s) are associated with this department. Reassign them first.`,
      });
    }

    await pool.query('DELETE FROM departments WHERE id = ?', [id]);

    return res.status(200).json({
      success: true,
      message: `Department '${existing[0].name}' deleted successfully`,
    });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  getAllDepartments,
  getDepartmentById,
  createDepartment,
  updateDepartment,
  deleteDepartment,
};
