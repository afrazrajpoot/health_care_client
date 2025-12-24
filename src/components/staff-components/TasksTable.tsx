"use client";

import styles from "./TasksTable.module.css";
import sharedStyles from "./shared.module.css";

interface Task {
  id: string;
  description: string;
  department: string;
  status: string;
  dueDate?: string;
  patient: string;
  priority?: string;
  quickNotes?: any;
  assignee?: string;
  actions?: string[];
}

interface TasksTableProps {
  tasks: Task[];
  taskStatuses: { [taskId: string]: string };
  taskAssignees: { [taskId: string]: string };
  onStatusClick: (taskId: string, status: string) => void;
  onAssigneeClick: (taskId: string, assignee: string) => void;
  onTaskClick: (task: Task) => void;
  getStatusOptions: (task: Task) => string[];
  getAssigneeOptions: (task: Task) => string[];
}

export default function TasksTable({
  tasks,
  taskStatuses,
  taskAssignees,
  onStatusClick,
  onAssigneeClick,
  onTaskClick,
  getStatusOptions,
  getAssigneeOptions,
}: TasksTableProps) {
  if (tasks.length === 0) {
    return (
      <section className={sharedStyles.card}>
        <div className={styles.emptyState}>
          <p>No tasks found</p>
        </div>
      </section>
    );
  }

  const getStatusChipColor = (status: string) => {
    if (
      status.toLowerCase().includes("signature") ||
      status.toLowerCase().includes("physician")
    )
      return sharedStyles.chipRed;
    if (status.toLowerCase().includes("progress"))
      return sharedStyles.chipAmber;
    if (status.toLowerCase().includes("scheduling"))
      return sharedStyles.chipBlue;
    if (status.toLowerCase().includes("completed"))
      return sharedStyles.chipGreen;
    return sharedStyles.chipBlue;
  };

  return (
    <section className={`${sharedStyles.card} ${styles.tasksSection}`}>
      <h3>Open Tasks & Required Actions</h3>
      <div className={styles.scrollContainer}>
        <div className={styles.tableContainer}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th className={styles.th}>Item</th>
                <th className={styles.th}>Status</th>
                <th className={styles.th}>Assignee</th>
                <th className={styles.th}>Type</th>
                <th className={styles.th}>Due</th>
                <th className={styles.th}></th>
              </tr>
            </thead>
            <tbody>
              {tasks.map((task) => {
                const currentStatus =
                  taskStatuses[task.id] || task.status || "Pending";
                const currentAssignee =
                  taskAssignees[task.id] || task.assignee || "Unclaimed";
                const statusOptions = getStatusOptions(task);
                const assigneeOptions = getAssigneeOptions(task);

                return (
                  <tr key={task.id}>
                    <td className={styles.td}>{task.description}</td>
                    <td className={styles.td}>
                      <div className={sharedStyles.statusChips}>
                        {statusOptions.map((status) => (
                          <span
                            key={status}
                            className={`${
                              sharedStyles.chip
                            } ${getStatusChipColor(status)} ${
                              sharedStyles.chipSelectable
                            } ${
                              currentStatus === status
                                ? sharedStyles.chipSelectableActive
                                : ""
                            }`}
                            onClick={() => onStatusClick(task.id, status)}
                          >
                            {status}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td className={styles.td}>
                      <div className={sharedStyles.statusChips}>
                        {assigneeOptions.map((assignee) => (
                          <span
                            key={assignee}
                            className={`${sharedStyles.chip} ${
                              assignee.startsWith("Assigned") ||
                              assignee === "Physician"
                                ? sharedStyles.chipBlue
                                : ""
                            } ${sharedStyles.chipSelectable} ${
                              currentAssignee === assignee
                                ? sharedStyles.chipSelectableActive
                                : ""
                            }`}
                            onClick={() => onAssigneeClick(task.id, assignee)}
                          >
                            {assignee}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td className={styles.td}>{task.department}</td>
                    <td className={styles.td}>
                      {task.dueDate
                        ? new Date(task.dueDate).toLocaleDateString("en-US", {
                            month: "2-digit",
                            day: "2-digit",
                          })
                        : "—"}
                    </td>
                    <td className={styles.td}>
                      <span
                        className={sharedStyles.actionLink}
                        onClick={() => onTaskClick(task)}
                      >
                        {task.department?.toLowerCase().includes("clinical") ||
                        task.department?.toLowerCase().includes("medical")
                          ? "Review"
                          : "View"}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
}
